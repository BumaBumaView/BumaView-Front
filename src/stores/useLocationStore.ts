import { create } from "zustand";

interface LocationState {
  currentLocation: string;
  changeLocation: (newLocation: string) => void;
}

const useLocationStore = create<LocationState>((set) => ({
  currentLocation: '/',
  changeLocation: (newLocation) =>
    set(() => ({ currentLocation: newLocation })),
}));

export default useLocationStore;