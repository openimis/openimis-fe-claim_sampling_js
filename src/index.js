import messages_en from "./translations/en.json";
import ClaimSamplingButton from "./components/ClaimSamplingButton";

const DEFAULT_CONFIG = {
  "translations": [{ key: "en", messages: messages_en }],
  "claimSampling.claimSamplingButton": [ClaimSamplingButton],
}


export const ClaimSamplingModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
}