import instance from "./instance";

export const fileApi = {
  /**
   * Upload a file and get back its URL (via proxy)
   * Uses the dedicated file upload endpoint (not assignment-specific)
   * @param {File} file - The file to upload
   * @param {"avatar"|"general"} purpose - Upload purpose (affects storage path & size limits)
   */
  upload: async (file, purpose = "general") => {
    // 1. Get presigned upload URL & token
    const initRes = await instance.post("files/initiate-upload", {
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      purpose,
    });
    
    const { uploadUrl, uploadToken } = initRes.data;
    
    // 2. Upload to MinIO via presigned URL
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });
    
    // 3. Confirm upload and get proxy URL
    const confirmRes = await instance.post("files/confirm-upload", {
      upload_token: uploadToken,
    });
    
    return confirmRes.data; // { url, objectKey, fileName, contentType, size, etag }
  },
};
