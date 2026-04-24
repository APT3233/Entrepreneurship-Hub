import instance from "./instance";

export const fileApi = {
  /**
   * Upload a file and get back its URL (via proxy)
   * This uses the existing lecturer attachment upload logic but exposed generally
   */
  upload: async (file) => {
    // 1. Get upload token
    const initRes = await instance.post("assignments/initiate-upload", {
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
    });
    
    const { uploadUrl, uploadToken } = initRes.data;
    
    // 2. Upload to MinIO (or wherever)
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });
    
    // 3. Confirm and get proxy URL
    const confirmRes = await instance.post("assignments/confirm-upload", {
      upload_token: uploadToken,
    });
    
    return confirmRes.data; // { url: "..." }
  },
};
