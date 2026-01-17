import { PageContainer, CreatePageForm } from "~/components";
import { GenerationQueue } from "~/components/GenerationQueue";

const CreatePage = () => {
  return (
    <PageContainer>
      <div className="flex flex-col justify-between w-full max-w-5xl m-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Create Images</h1>
        </div>

        {/* Active Processing Jobs */}
        <GenerationQueue
          showCompleted={false}
          maxJobs={5}
          className="mb-6"
        />

        <div className="w-full">
          <CreatePageForm />
        </div>
      </div>
    </PageContainer>
  );
};

export default CreatePage;
