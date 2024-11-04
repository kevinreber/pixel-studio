import { useLoaderData } from "@remix-run/react";
import { PageContainer } from "~/components";
import { SetPageLoader } from "~/routes/set.$setId";

const Image = ({
  src,
  alt,
  size = 24,
}: {
  src: string;
  alt: string;
  size?: number;
}) => {
  return (
    <div
      className="relative overflow-hidden m-auto w-full h-full"
      style={{ maxWidth: size, maxHeight: size }}
    >
      <img
        className="inset-0 object-cover cursor-pointer w-full h-full"
        src={src}
        alt={alt}
        loading="lazy"
      />
    </div>
  );
};

const SetDetailsPage = () => {
  const loaderData = useLoaderData<SetPageLoader>();
  const setData = loaderData.data ?? {
    images: [],
    prompt: "",
    createdAt: "",
    user: {},
  };
  const setImages = setData.images;
  const setPrompt = setData.prompt;
  const setCreatedAt = setData.createdAt;
  const setUser = setData.user;
  console.log(setImages);
  return (
    <PageContainer>
      <div className="flex flex-col justify-between w-full max-w-5xl m-auto">
        <h1 className="text-2xl font-semibold mb-4">Set Details</h1>
        <div className="w-full flex flex-col gap-4">
          <div>
            <div className="font-semibold">Prompt</div>
            <div className="text-sm italic text-zinc-300">{setPrompt}</div>
          </div>
          <div>
            <div className="font-semibold">Created At</div>
            <div className="text-sm text-zinc-300">
              {setCreatedAt} by{" "}
              <a className="font-semibold text-blue-500" href="#">
                {setUser.username}
              </a>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-2">Images</div>
            <div className="flex flex-wrap gap-4">
              {/* Render all images in the set */}
              {setImages.map((image) => (
                <div key={image.id}>
                  <Image src={image.url} alt={image.title} size={200} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default SetDetailsPage;
