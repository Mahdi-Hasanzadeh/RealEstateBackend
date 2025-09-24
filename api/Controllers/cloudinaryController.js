import { agenda } from "../Utility/agenda.js";

export const deleteImage = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const publicId = decodeURIComponent(req.params.publicId);
    if (!publicId) {
      return res
        .status(400)
        .json({ success: false, message: "PublicId is required" });
    }

    // **Schedule deletion via Agenda**
    await agenda.now("delete cloudinary image", { publicId });

    // Immediately respond to the client
    res
      .status(200)
      .json({ success: true, message: "Image deletion scheduled" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: "ServerError" });
  }
};
