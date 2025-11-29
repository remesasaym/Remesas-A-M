// DIY KYC Service - Free Self-Hosted Solution
import { supabase } from '../supabaseClient';

interface KYCUploadRequest {
    userId: string;
    documentImage: string; // base64
    selfieImage: string; // base64
    documentType?: 'id_card' | 'passport' | 'driver_license';
}

interface KYCUploadResponse {
    success: boolean;
    verificationId?: string;
    error?: string;
}

interface KYCStatusResponse {
    status: 'pending' | 'reviewing' | 'approved' | 'rejected';
    verificationId: string;
    documentUrl?: string;
    selfieUrl?: string;
    rejectionReason?: string;
    createdAt?: string;
    reviewedAt?: string;
}

interface KYCReviewRequest {
    verificationId: string;
    adminId: string;
    approved: boolean;
    reason?: string;
    notes?: string;
}

class DIYKYCService {
    private bucketName = 'kyc-documents';

    /**
     * Upload KYC documents (ID + selfie)
     */
    async uploadDocuments(request: KYCUploadRequest): Promise<KYCUploadResponse> {
        try {
            const { userId, documentImage, selfieImage, documentType = 'id_card' } = request;

            // 1. Upload document image to Supabase Storage
            const documentPath = `${userId}/document-${Date.now()}.jpg`;
            const documentBlob = this.base64ToBlob(documentImage);

            const { data: docData, error: docError } = await supabase.storage
                .from(this.bucketName)
                .upload(documentPath, documentBlob, {
                    contentType: 'image/jpeg',
                    upsert: false,
                });

            if (docError) throw new Error(`Document upload failed: ${docError.message}`);

            // 2. Upload selfie image
            const selfiePath = `${userId}/selfie-${Date.now()}.jpg`;
            const selfieBlob = this.base64ToBlob(selfieImage);

            const { data: selfieData, error: selfieError } = await supabase.storage
                .from(this.bucketName)
                .upload(selfiePath, selfieBlob, {
                    contentType: 'image/jpeg',
                    upsert: false,
                });

            if (selfieError) throw new Error(`Selfie upload failed: ${selfieError.message}`);

            // 3. Get public URLs
            const { data: { publicUrl: documentUrl } } = supabase.storage
                .from(this.bucketName)
                .getPublicUrl(documentPath);

            const { data: { publicUrl: selfieUrl } } = supabase.storage
                .from(this.bucketName)
                .getPublicUrl(selfiePath);

            // 4. Create verification record
            const { data: verification, error: dbError } = await supabase
                .from('kyc_verifications')
                .insert({
                    user_id: userId,
                    document_url: documentUrl,
                    selfie_url: selfieUrl,
                    document_type: documentType,
                    status: 'pending',
                })
                .select()
                .single();

            if (dbError) throw new Error(`Database error: ${dbError.message}`);

            console.log('✅ KYC documents uploaded successfully:', verification.id);

            return {
                success: true,
                verificationId: verification.id,
            };
        } catch (error) {
            console.error('❌ Error uploading KYC documents:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Get KYC verification status for a user
     */
    async getVerificationStatus(userId: string): Promise<KYCStatusResponse | null> {
        try {
            const { data, error } = await supabase
                .from('kyc_verifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No verification found
                    return null;
                }
                throw error;
            }

            return {
                status: data.status,
                verificationId: data.id,
                documentUrl: data.document_url,
                selfieUrl: data.selfie_url,
                rejectionReason: data.rejection_reason,
                createdAt: data.created_at,
                reviewedAt: data.reviewed_at,
            };
        } catch (error) {
            console.error('❌ Error getting KYC status:', error);
            return null;
        }
    }

    /**
     * Get all pending verifications (for admin)
     */
    async getPendingVerifications(): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('kyc_verifications')
                .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            phone
          )
        `)
                .in('status', ['pending', 'reviewing'])
                .order('created_at', { ascending: true });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('❌ Error getting pending verifications:', error);
            return [];
        }
    }

    /**
     * Admin: Approve or reject verification
     */
    async reviewVerification(request: KYCReviewRequest): Promise<{ success: boolean; error?: string }> {
        try {
            const { verificationId, adminId, approved, reason, notes } = request;

            // 1. Update verification status
            const { error: updateError } = await supabase
                .from('kyc_verifications')
                .update({
                    status: approved ? 'approved' : 'rejected',
                    reviewed_by: adminId,
                    reviewed_at: new Date().toISOString(),
                    rejection_reason: approved ? null : reason,
                    admin_notes: notes,
                })
                .eq('id', verificationId);

            if (updateError) throw updateError;

            // 2. If approved, update user's is_verified status
            if (approved) {
                const { data: verification } = await supabase
                    .from('kyc_verifications')
                    .select('user_id')
                    .eq('id', verificationId)
                    .single();

                if (verification) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .update({ is_verified: true })
                        .eq('id', verification.user_id);

                    if (profileError) {
                        console.error('⚠️ Failed to update profile verification status:', profileError);
                    }
                }
            }

            console.log(`✅ KYC verification ${approved ? 'approved' : 'rejected'}:`, verificationId);

            return { success: true };
        } catch (error) {
            console.error('❌ Error reviewing verification:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Helper: Convert base64 to Blob
     */
    private base64ToBlob(base64: string): Blob {
        // Remove data URL prefix if present
        const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: 'image/jpeg' });
    }
}

export const diyKycService = new DIYKYCService();
export type { KYCUploadRequest, KYCUploadResponse, KYCStatusResponse, KYCReviewRequest };
