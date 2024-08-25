// import { useLocation, useNavigate } from "@remix-run/react";
import { ImageTagType } from "../server/getImages";

const ImageV2 = ({ imageData }: { imageData: ImageTagType }) => {
  // const navigate = useNavigate();
  // const location = useLocation();

  // const handleImageClick = () => {
  //   // redirect user to explore.$imageId page when image is clicked
  //   // (this is the page that shows the image modal)
  //   navigate(
  //     `${
  //       location.search
  //         ? `${imageData.id}${location.search}`
  //         : `${imageData.id}`
  //     }`,
  //   );
  // };

  return (
    <div
      // TODO: Add hover affect that shows count of likes and comments
      className="relative overflow-hidden w-full pt-[100%]"
      // onClick={() => handleImageClick()}
    >
      <img
        className="inset-0 object-cover cursor-pointer absolute w-full h-full"
        src={imageData.thumbnailURL}
        alt={imageData.prompt}
      />
    </div>
  );
};

export default ImageV2;
