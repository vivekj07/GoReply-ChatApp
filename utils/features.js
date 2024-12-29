import { v2 as cloudinary } from "cloudinary"
import mongoose from "mongoose"
import { v4 } from "uuid"
import { io, userSocketIDs } from "../app.js"

const ConnectDB = (uri) => {

    mongoose.connect(uri).then(() => {
        console.log("Database connected successfully")
    }).catch((err) => {
        console.log(err)
        throw err
    }
    )
}

const emitEvent = (req, event, users, data) => {
    // console.log("emiting event", event)

    const usersSocket = getSockets(users)
    // const io = req.app.get("io")
    io.to(usersSocket).emit(event, data)

    // console.log("users", users)
    // console.log("ids", usersSocket)

}


const getSockets = (users = []) => {
    const sockets = users.map((user) => userSocketIDs.get(user.toString()))
    return sockets
}

export const getBase64 = (file) =>
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

// const uploadFlilesToCloudinary = async (files = [],foldername) => {
//     const UploadPromise = files.map((file) => {
//         console.log(file)
//         return new Promise((resolve, reject) => {
//             cloudinary.uploader.upload(
//                 getBase64(file),
//                 {
//                     public_id: v4(),
//                     resource_type: "auto",
//                     folder:foldername
//                 },
//                 (error, result) => {
//                     if (error) return reject(error);
//                     resolve(result)
//                 }
//             )
//         })
//     })

//     try {

//         const results = await Promise.all(UploadPromise)

//         const formatedResults = results.map(({ public_id, secure_url }) => ({
//             public_id,
//             url: secure_url
//         }))

//         return formatedResults

//     } catch (err) {
//         throw new Error("Error in uploading files on cloudinary")
//     }

// }

const uploadFlilesToCloudinary = async (files = [], foldername) => {
    // Function to detect file type based on MIME type
    const detectFileType = (file) => {
        const mimeType = file.mimetype.split('/')[0]; // Get the main type (e.g., "image", "video", "audio")
        if (mimeType === "image") return "Images";
        if (mimeType === "video") return "Videos";
        if (mimeType === "audio") return "Audios";
        return "Others"; // Default folder for unsupported MIME types
    };

    const UploadPromise = files.map((file) => {
        const subfolder = detectFileType(file); // Dynamically decide the subfolder
        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload(
                getBase64(file),
                {
                    public_id: v4(),
                    resource_type: "auto",
                    folder: `${foldername}/${subfolder}`, // Include subfolder based on MIME type
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
        });
    });

    try {
        const results = await Promise.all(UploadPromise);

        const formatedResults = results.map(({ public_id, secure_url }) => ({
            public_id,
            url: secure_url,
        }));

        return formatedResults;
    } catch (err) {
        throw new Error("Error in uploading files on Cloudinary: " + err.message);
    }
};


const deleteFilesFromCloudinary = async (publicIds) => {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      
      if (result.deleted) {
        console.log('Deleted resources from Cloudinary');
      } else {
        console.error('Error deleting files from Cloudinary:', result);
      }
    } catch (error) {
      console.error('Error deleting files from Cloudinary:', error);
      throw new Error("Error in deleting files from Cloudinary");
    }
  };

export { ConnectDB, emitEvent, getSockets, uploadFlilesToCloudinary,deleteFilesFromCloudinary }

