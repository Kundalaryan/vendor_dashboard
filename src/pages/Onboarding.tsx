import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, MapPin, Clock, ArrowRight, User, LogOut, ImageUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { authService } from "../services/authService";
import type { VendorProfile } from "../types/auth";

const DEFAULT_BANNER_IMAGE =
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop";
const DEFAULT_CROP_WIDTH = 800;
const DEFAULT_CROP_HEIGHT = 450;

// 1. Validation Schema
const onboardingSchema = z.object({
  outletName: z.string().min(3, "Outlet name is required"),
  address: z.string().min(5, "Address is required"),
  openingTime: z.string().min(1, "Opening time is required"),
  closingTime: z.string().min(1, "Closing time is required"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const resolveOutletImageUrl = (profile?: VendorProfile) =>
  profile?.outletImageUrl || profile?.outletImage || profile?.imageUrl || null;

const loadImageElement = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to read selected image."));
      image.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Unable to read selected image."));
    reader.readAsDataURL(file);
  });

const cropAndResizeImage = async (params: {
  file: File;
  outputWidth: number;
  outputHeight: number;
  focusX: number;
  focusY: number;
}) => {
  const { file, outputWidth, outputHeight, focusX, focusY } = params;
  const image = await loadImageElement(file);
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;

  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = outputWidth / outputHeight;

  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;

  if (sourceAspect > targetAspect) {
    cropWidth = sourceHeight * targetAspect;
  } else {
    cropHeight = sourceWidth / targetAspect;
  }

  const xWeight = Math.min(Math.max((focusX + 100) / 200, 0), 1);
  const yWeight = Math.min(Math.max((focusY + 100) / 200, 0), 1);
  const cropX = (sourceWidth - cropWidth) * xWeight;
  const cropY = (sourceHeight - cropHeight) * yWeight;

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not supported in this browser.");
  }

  context.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    outputWidth,
    outputHeight
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.85);
  });

  if (!blob) {
    throw new Error("Unable to process image.");
  }

  return new File([blob], `outlet-${Date.now()}.jpg`, { type: "image/jpeg" });
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccess, setImageSuccess] = useState<string | null>(null);
  const [outputWidth, setOutputWidth] = useState(DEFAULT_CROP_WIDTH);
  const [outputHeight, setOutputHeight] = useState(DEFAULT_CROP_HEIGHT);
  const [focusX, setFocusX] = useState(0);
  const [focusY, setFocusY] = useState(0);

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: authService.getMe,
  });

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
  });

  const onSubmit = async (data: OnboardingFormValues) => {
    try {
      setServerError(null);

      // API expects HH:mm:ss. Input[type="time"] returns HH:mm (24h format).
      // We append ":00" for seconds.
      await authService.completeOnboarding({
        outletName: data.outletName,
        address: data.address,
        openingTime: `${data.openingTime}:00`,
        closingTime: `${data.closingTime}:00`,
      });

      const updatedProfile = await authService.getMe();
      localStorage.setItem("vendor_info", JSON.stringify(updatedProfile));

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Onboarding Failed", error);
      setServerError(error.response?.data?.message || "Setup failed. Please try again.");
    }
  };

  const handleImagePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setImageError("Please select an image file.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setOutputWidth(DEFAULT_CROP_WIDTH);
    setOutputHeight(DEFAULT_CROP_HEIGHT);
    setFocusX(0);
    setFocusY(0);
    setImageError(null);
    setImageSuccess(null);
  };

  const handleUploadImage = async () => {
    if (!selectedImage) {
      setImageError("Please select an image first.");
      return;
    }
    if (outputWidth < 100 || outputHeight < 100 || outputWidth > 3000 || outputHeight > 3000) {
      setImageError("Width and height must be between 100 and 3000.");
      return;
    }

    try {
      setIsUploadingImage(true);
      setImageError(null);
      setImageSuccess(null);

      const croppedFile = await cropAndResizeImage({
        file: selectedImage,
        outputWidth,
        outputHeight,
        focusX,
        focusY,
      });

      await authService.uploadOutletImage(croppedFile);
      const refreshed = await refetchProfile();
      if (refreshed.data) {
        localStorage.setItem("vendor_info", JSON.stringify(refreshed.data));
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedImage(null);
      setPreviewUrl(null);
      setImageSuccess("Outlet image uploaded successfully.");
    } catch (error: any) {
      console.error("Image upload failed", error);
      setImageError(error.response?.data?.message || "Image upload failed. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vendor_token");
    localStorage.removeItem("vendor_info");
    localStorage.removeItem("remembered_phone");
    navigate("/login");
  };

  const activeBannerImage = resolveOutletImageUrl(profile) || DEFAULT_BANNER_IMAGE;
  const previewPosition = `${(focusX + 100) / 2}% ${(focusY + 100) / 2}%`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8">
      {/* Top Header with Profile/Logout Dropdown */}
      <div className="w-full flex justify-end max-w-2xl mb-4 relative z-10">
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <User size={20} />
          </button>

          {/* Logout Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 origin-top-right animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase">Account</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Banner Image Section */}
        <div className="h-40 bg-gray-900 relative">
          <img src={activeBannerImage} alt="Outlet" className="w-full h-full object-cover opacity-50" />
          <div className="absolute bottom-0 left-0 p-8 text-white">
            <h1 className="text-2xl font-bold">Finish setting up your outlet</h1>
            <p className="text-gray-200 text-sm mt-1">
              Please verify and complete your business hours to start receiving orders.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8 sm:p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {serverError}
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Outlet Image</label>

              <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                <img src={activeBannerImage} alt="Current outlet cover" className="w-full h-36 object-cover" />
              </div>

              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                <ImageUp size={16} />
                Choose image
                <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
              </label>

              {previewUrl && (
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 space-y-4">
                  <div
                    className="w-full overflow-hidden rounded-lg border border-gray-200 bg-black/10"
                    style={{ aspectRatio: `${outputWidth} / ${outputHeight}` }}
                  >
                    <img
                      src={previewUrl}
                      alt="Crop preview"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: previewPosition }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                        Width (px)
                      </label>
                      <input
                        type="number"
                        min={100}
                        max={3000}
                        value={outputWidth}
                        onChange={(event) => setOutputWidth(Number(event.target.value) || 0)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                        Height (px)
                      </label>
                      <input
                        type="number"
                        min={100}
                        max={3000}
                        value={outputHeight}
                        onChange={(event) => setOutputHeight(Number(event.target.value) || 0)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                      Horizontal Crop Focus
                    </label>
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      value={focusX}
                      onChange={(event) => setFocusX(Number(event.target.value))}
                      className="w-full mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                      Vertical Crop Focus
                    </label>
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      value={focusY}
                      onChange={(event) => setFocusY(Number(event.target.value))}
                      className="w-full mt-1"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => {
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                      }
                      setSelectedImage(null);
                      setPreviewUrl(null);
                    }}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleUploadImage} isLoading={isUploadingImage}>
                      Upload Cropped Image
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Upload endpoint: <span className="font-medium text-gray-700">POST /vendor/me/image</span> using
                multipart form field <span className="font-medium text-gray-700">file</span>.
              </p>

              {imageError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {imageError}
                </div>
              )}
              {imageSuccess && (
                <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">
                  {imageSuccess}
                </div>
              )}
            </div>

            <Input
              label="Outlet Name"
              placeholder="GrandStand Express"
              icon={<Store size={18} />}
              {...register("outletName")}
              error={errors.outletName?.message}
            />

            <Input
              label="Address"
              placeholder="NORTH BLOCK IIT JAMMU"
              icon={<MapPin size={18} />}
              {...register("address")}
              error={errors.address?.message}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Clock size={16} className="inline mr-2 text-blue-600" />
                Operational Hours <span className="text-gray-400 font-normal ml-1">(24-hour format)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wide">Opening Time</span>
                  <div className="relative">
                    <input
                      type="time"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm bg-white"
                      {...register("openingTime")}
                    />
                  </div>
                  {errors.openingTime && (
                    <p className="text-xs text-red-500">{errors.openingTime.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wide">Closing Time</span>
                  <div className="relative">
                    <input
                      type="time"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-500 transition-all text-sm bg-white"
                      {...register("closingTime")}
                    />
                  </div>
                  {errors.closingTime && (
                    <p className="text-xs text-red-500">{errors.closingTime.message}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-blue-100 text-blue-600 rounded-full text-[10px] flex items-center justify-center font-bold">
                  i
                </span>
                Your menu will only be visible between these hours.
              </p>
            </div>

            <div className="pt-4">
              <Button type="submit" isLoading={isSubmitting} className="w-full">
                Complete Setup <ArrowRight size={18} />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Need help with your outlet setup?{" "}
        <a href="#" className="text-blue-600 font-medium hover:underline">
          Contact Support
        </a>
      </div>
    </div>
  );
}
