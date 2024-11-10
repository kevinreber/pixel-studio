import { useLocation, useNavigate } from "@remix-run/react";
import { ImageTagType } from "server/getImages";

const ImageV2 = ({ imageData }: { imageData: ImageTagType }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleImageClick = () => {
    // redirect user to explore.$imageId page when image is clicked
    // (this is the page that shows the image modal)
    navigate(
      `${
        location.search
          ? `${imageData.id}${location.search}`
          : `${imageData.id}`
      }`
    );
  };

  return (
    <button
      type="button"
      className="relative overflow-hidden w-full h-full pt-[100%] m-0"
      onClick={() => handleImageClick()}
    >
      <img
        className="inset-0 object-cover cursor-pointer absolute w-full h-full"
        src={imageData.thumbnailURL}
        alt={imageData.prompt}
      />
    </button>
  );
};

export default ImageV2;
