// import React from "react";
import { PageContainer, CreatePageForm } from "~/components";

const CreatePage = () => {
  return (
    <PageContainer>
      <div className="flex flex-col justify-between w-full max-w-5xl m-auto">
        <h1 className="text-2xl font-semibold mb-4">Create Images</h1>
        <div className="w-full">
          <CreatePageForm />
        </div>
      </div>
    </PageContainer>
  );
};

export default CreatePage;
