import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Utensils, Search, User, LogOut, ChevronDown, ImageUp, Loader2, BellRing } from "lucide-react";
import { PrintManager } from "../features/print/PrintManager";
import { authService } from "../services/authService";
import { orderService } from "../services/orderService";
import type { Order } from "../types/order";

const DEFAULT_CROP_WIDTH = 800;
const DEFAULT_CROP_HEIGHT = 450;
const MAX_SOURCE_FILE_BYTES = 12 * 1024 * 1024;
const MAX_UPLOAD_FILE_BYTES = 900 * 1024;

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

const cropAndCompressImage = async (params: {
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
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported in this browser.");
  }

  let width = outputWidth;
  let height = outputHeight;
  let quality = 0.85;

  const toBlob = () =>
    new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });

  for (let attempt = 0; attempt < 6; attempt += 1) {
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, width, height);

    const blob = await toBlob();
    if (!blob) {
      throw new Error("Unable to process image.");
    }

    if (blob.size <= MAX_UPLOAD_FILE_BYTES) {
      return new File([blob], `outlet-${Date.now()}.jpg`, { type: "image/jpeg" });
    }

    if (quality > 0.55) {
      quality -= 0.1;
    } else {
      width = Math.max(320, Math.floor(width * 0.85));
      height = Math.max(180, Math.floor(height * 0.85));
    }
  }

  throw new Error("Processed image is still too large. Try a smaller crop size.");
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileImageError, setProfileImageError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputWidth, setOutputWidth] = useState(DEFAULT_CROP_WIDTH);
  const [outputHeight, setOutputHeight] = useState(DEFAULT_CROP_HEIGHT);
  const [focusX, setFocusX] = useState(0);
  const [focusY, setFocusY] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousPendingCountRef = useRef(0);
  const pendingCountInitializedRef = useRef(false);
  const { data: profile } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: authService.getMe,
  });
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: orderService.getOrders,
    refetchInterval: 5000,
  });
  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Orders", path: "/orders" },
    { name: "Menu", path: "/menu" },
  ];
  const outletImageUrl = profile?.outletImageUrl || profile?.outletImage || profile?.imageUrl || null;
  const pendingOrderCount = orders.filter(
    (order) => order.paymentStatus === "PAID" && order.orderStatus === "ORDER_PLACED"
  ).length;
  const showOrdersDot = pendingOrderCount > 0 && location.pathname !== "/orders";

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const markInteracted = () => {
      setHasInteracted(true);
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          return;
        }
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioCtx();
        }
        void audioContextRef.current.resume();
      } catch {
        // no-op
      }
    };

    window.addEventListener("pointerdown", markInteracted, { once: true });
    window.addEventListener("keydown", markInteracted, { once: true });
    return () => {
      window.removeEventListener("pointerdown", markInteracted);
      window.removeEventListener("keydown", markInteracted);
    };
  }, []);

  useEffect(() => {
    if (!pendingCountInitializedRef.current) {
      previousPendingCountRef.current = pendingOrderCount;
      pendingCountInitializedRef.current = true;
      return;
    }

    const previousCount = previousPendingCountRef.current;
    if (
      hasInteracted &&
      pendingOrderCount > previousCount &&
      location.pathname !== "/orders"
    ) {
      void playOrderAlertSound();
    }

    previousPendingCountRef.current = pendingOrderCount;
  }, [hasInteracted, pendingOrderCount, location.pathname]);

  useEffect(() => {
    if (!hasInteracted || pendingOrderCount <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void playOrderAlertSound();
    }, 3 * 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasInteracted, pendingOrderCount]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {
          // no-op
        });
      }
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("vendor_token");
    localStorage.removeItem("vendor_info");
    localStorage.removeItem("remembered_phone");
    navigate("/login");
  };

  const handleProfileImagePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setProfileImageError("Please select an image file.");
      return;
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      setProfileImageError("Selected file is too large. Please pick an image under 12MB.");
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
    setProfileImageError(null);
  };

  const handleCancelImageEdit = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
    setOutputWidth(DEFAULT_CROP_WIDTH);
    setOutputHeight(DEFAULT_CROP_HEIGHT);
    setFocusX(0);
    setFocusY(0);
    setProfileImageError(null);
  };

  const handleUploadCroppedProfileImage = async () => {
    if (!selectedImage) {
      setProfileImageError("Please choose an image first.");
      return;
    }
    if (outputWidth < 200 || outputHeight < 120 || outputWidth > 2500 || outputHeight > 2500) {
      setProfileImageError("Width/height must be between 200 and 2500.");
      return;
    }

    try {
      setIsUploadingImage(true);
      setProfileImageError(null);
      const processedFile = await cropAndCompressImage({
        file: selectedImage,
        outputWidth,
        outputHeight,
        focusX,
        focusY,
      });
      await authService.uploadOutletImage(processedFile);
      const refreshedProfile = await queryClient.fetchQuery({
        queryKey: ["vendor-profile"],
        queryFn: authService.getMe,
      });
      localStorage.setItem("vendor_info", JSON.stringify(refreshedProfile));
      handleCancelImageEdit();
    } catch (error: any) {
      setProfileImageError(
        error.response?.data?.message || error.message || "Image upload failed."
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const playOrderAlertSound = async () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        return;
      }
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      const context = audioContextRef.current;
      if (context.state !== "running") {
        await context.resume();
      }

      const now = context.currentTime;
      const totalPulses = 6;
      const pulseDuration = 0.22;
      const pulseGap = 0.12;

      for (let i = 0; i < totalPulses; i += 1) {
        const start = now + i * (pulseDuration + pulseGap);
        const end = start + pulseDuration;
        const gainNode = context.createGain();
        gainNode.gain.setValueAtTime(0.0001, start);
        gainNode.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, end);
        gainNode.connect(context.destination);

        const osc = context.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(i % 2 === 0 ? 820 : 980, start);
        osc.connect(gainNode);
        osc.start(start);
        osc.stop(end);
      }
    } catch {
      // Audio can fail due to browser autoplay/user policies.
    }
  };

  const previewPosition = `${(focusX + 100) / 2}% ${(focusY + 100) / 2}%`;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Search */}
          <div className="flex items-center gap-8 flex-1">
            <Link to="/dashboard" className="flex items-center gap-2 text-blue-600 font-bold text-lg">
              <Utensils className="w-6 h-6" />
              <span className="text-gray-900">
                {profile?.outletName || "Vendor Portal"}
              </span>
            </Link>
            
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search orders, menu..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all outline-none"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1 mx-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === item.path 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {item.name}
                  {item.path === "/orders" && showOrdersDot && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <PrintManager />
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm text-gray-700 transition-colors"
              >
                {outletImageUrl ? (
                  <img
                    src={outletImageUrl}
                    alt="Outlet"
                    className="w-6 h-6 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 inline-flex items-center justify-center">
                    <User size={14} />
                  </span>
                )}
                <span className="hidden sm:block max-w-[150px] truncate">
                  {profile?.name || "Profile"}
                </span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Account
                  </p>

                  <div className="space-y-1 border border-gray-100 rounded-lg p-3 bg-gray-50">
                    {outletImageUrl && (
                      <img
                        src={outletImageUrl}
                        alt="Outlet"
                        className="w-full h-24 object-cover rounded-md mb-2 border border-gray-200"
                      />
                    )}
                    <p className="text-sm font-semibold text-gray-900">{profile?.name || "-"}</p>
                    <p className="text-xs text-gray-600">{profile?.phone || "-"}</p>
                    <p className="text-xs text-gray-600">
                      Outlet: {profile?.outletName || "Not set"}
                    </p>
                    <p className="text-xs text-gray-600">
                      Service: {profile?.serviceType || "-"}
                    </p>
                  </div>

                  {!selectedImage && (
                    <label className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors">
                      <ImageUp size={14} />
                      Choose Outlet Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileImagePick}
                        disabled={isUploadingImage}
                      />
                    </label>
                  )}

                  {selectedImage && previewUrl && (
                    <div className="mt-3 rounded-lg border border-gray-200 p-3 bg-gray-50">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Image Editor
                      </p>
                      <div
                        className="w-full overflow-hidden rounded-md border border-gray-200"
                        style={{ aspectRatio: `${outputWidth} / ${outputHeight}` }}
                      >
                        <img
                          src={previewUrl}
                          alt="Crop preview"
                          className="w-full h-full object-cover"
                          style={{ objectPosition: previewPosition }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <input
                          type="number"
                          min={200}
                          max={2500}
                          value={outputWidth}
                          onChange={(event) => setOutputWidth(Number(event.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                          placeholder="Width"
                        />
                        <input
                          type="number"
                          min={120}
                          max={2500}
                          value={outputHeight}
                          onChange={(event) => setOutputHeight(Number(event.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                          placeholder="Height"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-gray-500">
                        Recommended size: {DEFAULT_CROP_WIDTH} x {DEFAULT_CROP_HEIGHT}
                      </p>

                      <label className="block mt-2 text-[11px] font-medium text-gray-600">
                        Horizontal Focus
                      </label>
                      <input
                        type="range"
                        min={-100}
                        max={100}
                        value={focusX}
                        onChange={(event) => setFocusX(Number(event.target.value))}
                        className="w-full"
                      />

                      <label className="block mt-1 text-[11px] font-medium text-gray-600">
                        Vertical Focus
                      </label>
                      <input
                        type="range"
                        min={-100}
                        max={100}
                        value={focusY}
                        onChange={(event) => setFocusY(Number(event.target.value))}
                        className="w-full"
                      />

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleCancelImageEdit}
                          className="px-2 py-2 rounded-md text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
                          disabled={isUploadingImage}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleUploadCroppedProfileImage}
                          className="px-2 py-2 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center justify-center gap-1"
                          disabled={isUploadingImage}
                        >
                          {isUploadingImage && <Loader2 size={12} className="animate-spin" />}
                          {isUploadingImage ? "Uploading..." : "Upload"}
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="mt-2 text-[11px] text-gray-500">
                    Upload limit: source under 12MB, optimized upload under 900KB.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setHasInteracted(true);
                      void playOrderAlertSound();
                    }}
                    className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <BellRing size={14} />
                    Test Alert Sound
                  </button>
                  {profileImageError && (
                    <p className="mt-2 text-xs text-red-600">{profileImageError}</p>
                  )}

                  <button
                    onClick={handleLogout}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1600px] mx-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
