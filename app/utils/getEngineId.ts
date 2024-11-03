const STABLE_DIFFUSION_XL_ID = "stable-diffusion-xl-1024-v1-0";
const STABLE_DIFFUSION_1_5_ID = "stable-diffusion-v1-5";
const STABLE_DIFFUSION_2_1_ID = "stable-diffusion-512-v2-1";

export const getEngineId = (model: string) => {
  let engineId = STABLE_DIFFUSION_XL_ID;
  if (model.includes("1-5")) {
    engineId = STABLE_DIFFUSION_1_5_ID;
  }
  if (model.includes("2-5")) {
    engineId = STABLE_DIFFUSION_2_1_ID;
  }
  return engineId;
};
