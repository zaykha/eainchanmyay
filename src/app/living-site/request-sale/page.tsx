"use client";

import { Suspense, useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from "react";
import styled, { css, keyframes } from "styled-components";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  BadgeDollarSign,
  BatteryCharging,
  Building2,
  CheckCircle2,
  ChevronRight,
  ImagePlus,
  Home,
  Hotel,
  MapPin,
  ParkingSquare,
  Sparkles,
  Store,
  Sun,
  TowerControl,
  UserRound,
  Warehouse,
} from "lucide-react";
import { MarketplaceHeader } from "@/app/living-site/components/MarketplaceHeader";
import { SectionTitle, Panel } from "@/app/living-site/components/PageSection";
import { useAppState } from "@/app/living-site/lib/app-state";
import { getDistricts, getStates, getTownships } from "@/app/living-site/lib/myanmar-geo";
import { CustomInput } from "@/app/living-site/components/form-controls/CustomInput";
import { CustomSelect } from "@/app/living-site/components/form-controls/CustomSelect";
import { CustomTextarea } from "@/app/living-site/components/form-controls/CustomTextarea";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";
import {
  getOwnedPropertiesForUser,
  getOwnedPropertyById,
  getSalesRequestById,
  getSalesRequestsForUser,
  updateOwnedProperty,
  updateSalesRequest,
} from "@/app/living-site/lib/data";
import { getVendorPlan, getUpgradePlan } from "@/lib/vendor-plans";
import {
  formatPropertyTypeValue,
  isBedBathPropertyType,
  normalizeSelectablePropertyType,
  propertyTypeDefinitions,
  type PropertyType,
} from "@/lib/property-types";
import { moderateListingText } from "@/lib/moderation-rules";

const PageShell = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  gap: 16px;
`;

const BackButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  background: transparent;
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  width: fit-content;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Stepper = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const StepPill = styled.span<{ $active?: boolean; $completed?: boolean; $status?: "default" | "error" | "success" }>`
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid
    ${(props) =>
      props.$status === "success"
        ? "#1f9d55"
        : props.$status === "error"
          ? "var(--color-danger)"
          : "var(--color-outline)"};
  background: ${(props) => {
    if (props.$completed) {
      return "color-mix(in srgb, #1f9d55 14%, transparent)";
    }
    if (props.$status === "error") {
      return "color-mix(in srgb, var(--color-danger) 10%, transparent)";
    }
    return props.$active
      ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
      : "var(--color-surface-2)";
  }};
  color: ${(props) => {
    if (props.$completed || props.$status === "success") return "#1f9d55";
    if (props.$status === "error") return "var(--color-danger)";
    return props.$active ? "var(--color-primary)" : "var(--color-muted)";
  }};
  font-weight: 600;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const StepIconWrap = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const FormCard = styled(Panel)`
  display: grid;
  gap: 14px;
  background: var(--color-surface-2);
`;

const TileGrid = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(112px, 148px));
  justify-content: start;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const UploadHint = styled.div`
  font-size: 0.84rem;
  color: var(--color-muted);
`;

const UploadStrip = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: thin;
`;

const UploadSlot = styled.div<{ $filled?: boolean; $image?: string | null }>`
  border: 1px solid var(--color-outline);
  border-radius: 14px;
  background: var(--color-surface);
  min-width: 120px;
  width: 120px;
  aspect-ratio: 4 / 3;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  padding: 0;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  color: var(--color-text);
  background-image: ${(props) => (props.$image ? `url(${props.$image})` : "none")};
  background-size: cover;
  background-position: center;
`;

const UploadSlotOverlay = styled.div<{ $filled?: boolean }>`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: ${(props) => (props.$filled ? "rgba(9, 13, 22, 0.2)" : "transparent")};
`;

const UploadSlotInner = styled.div`
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 10px;
  text-align: center;
  font-size: 0.76rem;
  color: var(--color-muted);
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(9, 13, 22, 0.7);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  z-index: 2;
`;

const Tile = styled.button<{ $active?: boolean; $status?: "default" | "error" | "success" }>`
  border: 1px solid
    ${(props) =>
      props.$active
        ? "var(--color-primary)"
        : props.$status === "success"
          ? "#1f9d55"
          : props.$status === "error"
            ? "var(--color-danger)"
            : "var(--color-outline)"};
  border-radius: 14px;
  padding: 12px;
  background: ${(props) =>
    props.$active
      ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
      : "var(--color-surface-2)"};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};
  display: grid;
  gap: 6px;
  justify-items: center;
  font-weight: 600;
  font-size: 0.82rem;
  text-align: center;
  line-height: 1.15;
  cursor: pointer;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const PropertyGroups = styled.div`
  display: grid;
  gap: 14px;
`;

const PropertyGroup = styled.div`
  display: grid;
  gap: 8px;
`;

const PropertyGroupLabel = styled.div`
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-muted);
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const PrimaryButton = styled.button`
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  background: var(--gradient);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--frame-shadow);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  line-height: 1;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  background: var(--color-surface-2);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Muted = styled.p`
  margin: 0;
  color: var(--color-muted);
`;

const ErrorText = styled.p`
  margin: 0;
  color: var(--color-danger);
  font-weight: 600;
`;

const MapInstruction = styled.div`
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.8);
  padding: 10px 12px;
  font-size: 0.82rem;
  color: var(--color-muted);
`;

const LimitNotice = styled.div<{ $danger?: boolean }>`
  border-radius: 18px;
  border: 1px solid ${(props) => (props.$danger ? "rgba(255, 148, 148, 0.22)" : "rgba(255, 210, 92, 0.22)")};
  background: ${(props) => (props.$danger ? "rgba(255, 148, 148, 0.08)" : "rgba(255, 210, 92, 0.08)")};
  padding: 14px 16px;
  color: ${(props) => (props.$danger ? "#a61c2f" : "#7a5b00")};
  line-height: 1.6;
`;

const PaidUpgradeSlot = styled.a`
  border: 2px dashed var(--color-primary);
  border-radius: 14px;
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  min-width: 120px;
  width: 120px;
  aspect-ratio: 4 / 3;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  padding: 0;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  color: var(--color-primary);
  text-decoration: none;
`;

const UpgradeSlotInner = styled.div`
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 10px;
  text-align: center;
  font-size: 0.76rem;
`;

const UpgradeLink = styled.span`
  color: var(--color-primary);
  font-weight: 700;
  text-decoration: underline;
  font-size: 0.75rem;
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const attentionShake = keyframes`
  0% {
    transform: translateX(0);
  }
  30% {
    transform: translateX(-3px);
  }
  60% {
    transform: translateX(3px);
  }
  100% {
    transform: translateX(0);
  }
`;

const REQUEST_DESCRIPTION_MAX_LENGTH = 500;
const REQUEST_SALE_ENGLISH: Record<string, string> = {
  "common.back": "Back",
  "common.next": "Next",
  "common.loading": "Loading",
  "common.submitting": "Submitting",
  "common.saveChanges": "Save changes",
  "listing.submitRequest": "Publish listing",
  "requestSale.titleNew": "Request a sale listing",
  "requestSale.titleEdit": "Edit property request",
  "requestSale.subtitleNew": "Share your property details and publish to the marketplace.",
  "requestSale.subtitleEdit": "Update your property listing details.",
  "requestSale.signInPrompt": "Sign in to continue with your property submission.",
  "requestSale.signInContinue": "Sign in to continue",
  "requestSale.steps.basics": "Basics",
  "requestSale.steps.location": "Location",
  "requestSale.steps.details": "Details",
  "requestSale.steps.pricing": "Pricing",
  "requestSale.steps.contact": "Contact person",
  "requestSale.titleLabel": "Title",
  "requestSale.descriptionLabel": "Description",
  "requestSale.dealTypeLabel": "Deal type",
  "requestSale.dealType.sale": "For sale",
  "requestSale.dealType.rent": "For rent",
  "requestSale.stateRegionLabel": "State / Region",
  "requestSale.cityLabel": "District / City",
  "requestSale.townshipLabel": "Township",
  "requestSale.addressLabel": "Address text",
  "requestSale.locateOnMap": "Locate on map",
  "requestSale.useLatLng": "Use latitude and longitude",
  "requestSale.mapHelper": "Select your area, then place the exact pin on the map.",
  "requestSale.areaLabel": "Area (sq ft)",
  "requestSale.floorCountLabel": "Floors",
  "requestSale.roomCountLabel": "Rooms",
  "requestSale.bedroomsLabel": "Bedrooms",
  "requestSale.bathroomsLabel": "Bathrooms",
  "requestSale.lift": "Lift",
  "requestSale.parking": "Parking",
  "requestSale.backupPower": "Backup power",
  "requestSale.backupPower.solar": "Solar",
  "requestSale.backupPower.generator": "Generator",
  "requestSale.priceLabel": "Price (Lakh)",
  "requestSale.currencyLabel": "Currency",
  "requestSale.buyerFacingContact": "Buyer-facing contact",
  "requestSale.publicBadge": "Public",
  "requestSale.chooseContactDescription": "Choose the contact buyers should see on this listing.",
  "requestSale.agencyProfileContact": "Use agency profile contact",
  "requestSale.recommendedBadge": "Recommended",
  "requestSale.agencyProfileDescription": "Buyers will see your agency storefront contact details.",
  "requestSale.customListingContact": "Use custom contact for this listing",
  "requestSale.customListingDescription": "Show a different contact person for this listing only.",
  "requestSale.directOwnerContact": "This listing will use the contact person details below.",
  "requestSale.listingContactName": "Listing contact name",
  "requestSale.listingContactPrimaryPhone": "Primary phone",
  "requestSale.listingContactSecondaryPhone": "Secondary phone",
  "requestSale.agencyPreview": "This listing will use your agency profile contact details.",
  "requestSale.internalBadge": "Internal",
  "requestSale.privateOwnerDetails": "Private owner details",
  "requestSale.privateOwnerDescription": "These details stay internal and help your team manage the listing.",
  "requestSale.ownerName": "Owner name",
  "requestSale.ownerPhone": "Owner phone",
  "requestSale.ownerPhoneSecondary": "Owner secondary phone",
  "requestSale.ownerNote": "Owner note",
  "requestSale.loadingRequest": "Loading request...",
  "requestSale.submittingRequest": "Submitting request...",
  "requestSale.successUpdated": "Your listing was updated.",
  "requestSale.successThanks": "Thanks for your submission.",
  "requestSale.successReviewUpdate": "Your listing has been updated.",
  "requestSale.successReviewNew": "Your listing is now live on the marketplace.",
  "requestSale.browseListings": "Browse listings",
  "requestSale.goActivities": "Go to Account",
  "requestSale.latitudeLabel": "Latitude",
  "requestSale.longitudeLabel": "Longitude",
  "requestSale.contactNameLabel": "Contact person name",
  "requestSale.listingContactNameError": "Listing contact name is required.",
  "requestSale.primaryPhoneError": "Primary phone number is required.",
  "requestSale.error.load": "Could not load this request.",
  "requestSale.error.locationNotFound": "Location not found. Try a nearby area.",
  "requestSale.error.locate": "Could not locate this area automatically.",
  "requestSale.error.latLng": "Enter a valid latitude and longitude.",
  "requestSale.error.locationRequired": "Complete the location fields before continuing.",
  "requestSale.error.priceRequired": "Price is required.",
  "requestSale.error.completeRequired": "Complete all required fields before continuing.",
  "requestSale.error.backupRequired": "Choose at least one backup power type.",
  "requestSale.error.signIn": "Sign in to continue.",
  "requestSale.error.updateFailed": "Could not update this request.",
  "requestSale.error.submitFailed": "Could not submit this request.",
  "property.land": "Land",
  "property.house": "House",
  "property.apartment": "Apartment",
  "property.miniCondo": "Mini condo",
  "property.condo": "Condo",
  "property.servicedApartment": "Serviced apartment",
  "property.shop": "Shop",
  "property.office": "Office",
  "property.shopOffice": "Shop / Office",
  "property.hotel": "Hotel",
  "property.restaurant": "Restaurant",
  "property.marketplace": "Marketplace",
  "property.warehouse": "Warehouse",
  "property.industrial": "Industrial",
  "property.project": "Project",
};

const requestSaleText = (key: string) => REQUEST_SALE_ENGLISH[key] ?? key;
const isUsableMapCoordinate = (lat: number, lng: number) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  Math.abs(lat) > 1 &&
  Math.abs(lng) > 1;
const isReviewLocked = (value: unknown) => String(value ?? "").toLowerCase() === "pending";

const MapFrame = styled.div<{ $status?: "default" | "error" | "success" }>`
  position: relative;
  border-radius: 16px;
  border: 1px solid
    ${(props) =>
      props.$status === "success"
        ? "#1f9d55"
        : props.$status === "error"
          ? "var(--color-danger)"
          : "var(--color-outline)"};
  background: var(--color-surface-2);
  overflow: hidden;
  min-height: 280px;
`;

const MapCanvas = styled.div<{ $inactive?: boolean }>`
  width: 100%;
  height: 320px;
  filter: ${(props) => (props.$inactive ? "blur(4px)" : "none")};
  transition: filter 0.2s ease;
  pointer-events: ${(props) => (props.$inactive ? "none" : "auto")};

  .leaflet-container {
    width: 100%;
    height: 100%;
    background: var(--color-surface);
  }
`;

const MapOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(9, 13, 22, 0.65);
  color: var(--color-text);
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  pointer-events: none;
`;

const MapActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const MapButton = styled.button<{ $attention?: boolean }>`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  background: var(--color-surface-2);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  ${(props) =>
    props.$attention
      ? css`
          animation: ${attentionShake} 0.6s ease;
        `
      : ""}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MapHelper = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: 0.85rem;
`;

const SuccessOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--color-paper) 68%, transparent);
  display: grid;
  place-items: center;
  z-index: 1200;
  padding: 16px;
`;

const SuccessModal = styled(Panel)`
  max-width: 520px;
  width: min(520px, 92vw);
  display: grid;
  gap: 14px;
  animation: ${fadeIn} 0.2s ease-out;
`;

const HelpOverlay = styled(SuccessOverlay)`
  z-index: 1300;
`;

const HelpModal = styled(SuccessModal)`
  max-width: 560px;
`;

const HelpList = styled.ul`
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 8px;
  color: var(--color-muted);
  line-height: 1.55;
`;

const LatLngButton = styled(MapButton)`
  width: fit-content;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-surface-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline);
`;

const ToggleLabel = styled.label`
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.9rem;
`;

const Toggle = styled.button<{ $checked: boolean }>`
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--color-outline);
  border: none;
  cursor: pointer;
  flex-shrink: 0;

  ${({ $checked }) => $checked && css`
    background: var(--color-primary);
  `}

  &:hover {
    background: color-mix(in srgb, var(--color-primary) 8%, var(--color-outline));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

const ToggleTrack = styled.div`
  position: absolute;
  inset: 2px;
  border-radius: 10px;
  background: var(--color-surface);
`;

const ToggleThumb = styled.div<{ $checked: boolean }>`
  position: absolute;
  top: 2px;
  left: ${({ $checked }) => ($checked ? "calc(100% - 20px)" : "2px")};
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-paper);
  box-shadow: var(--frame-shadow);
  transition: left 0.2s ease;
`;

// NEW CONTACT STEP COMPONENTS
const Badge = styled.span<{ $variant?: "public" | "internal" | "recommended" | "optional" }>`
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  ${({ $variant }) => $variant === "public" && css`
    background: color-mix(in srgb, #10b981 20%, transparent);
    color: #059669;
    border: 1px solid #34d399;
  `}
  
  ${({ $variant }) => $variant === "internal" && css`
    background: color-mix(in srgb, #6b7280 20%, transparent);
    color: #4b5563;
    border: 1px solid #9ca3af;
  `}
  
  ${({ $variant }) => $variant === "recommended" && css`
    background: color-mix(in srgb, #f59e0b 20%, transparent);
    color: #d97706;
    border: 1px solid #fbbf24;
  `}

  ${({ $variant }) => $variant === "optional" && css`
    background: color-mix(in srgb, #64748b 14%, transparent);
    color: #475569;
    border: 1px solid color-mix(in srgb, #64748b 28%, transparent);
  `}
`;

const RadioCardGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 16px 0;
`;

const RadioCard = styled.button<{ $active: boolean }>`
  display: flex;
  gap: 12px;
  padding: 16px;
  border: 2px solid var(--color-outline);
  border-radius: 12px;
  background: var(--color-surface);
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $active }) => $active && css`
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 8%, transparent);
    box-shadow: var(--frame-shadow);
  `}
  
  &:hover {
    border-color: color-mix(in srgb, var(--color-primary) 50%, transparent);
  }
`;

const RadioCardContent = styled.div`
  display: grid;
  gap: 8px;
  text-align: left;
  flex: 1;
`;

const RadioCardHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const RadioCardTitle = styled.strong`
  font-size: 1rem;
  line-height: 1.3;
`;

const RadioCardDescription = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.5;
`;

const RadioIndicator = styled.div<{ $active: boolean }>`
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-outline);
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
  
  ${({ $active }) => $active && css`
    border-color: var(--color-primary);
    background: var(--color-primary);
    
    &::after {
      content: "";
      position: absolute;
      inset: 4px;
      border-radius: 50%;
      background: var(--color-paper);
    }
  `}
`;

const CollapsibleSection = styled.div`
  margin-top: 24px;
  border: 1px solid var(--color-outline);
  border-radius: 12px;
  overflow: hidden;
`;

const CollapsibleTrigger = styled.button<{ $expanded: boolean }>`
  width: 100%;
  padding: 16px 20px;
  background: var(--color-surface);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  
  ${({ $expanded }) => $expanded && css`
    background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
  `}
`;

const CollapsibleText = styled.div`
  display: grid;
  gap: 8px;
  text-align: left;
`;

const CollapsibleChevron = styled(ChevronRight)<{ $expanded: boolean }>`
  flex-shrink: 0;
  transition: transform 0.2s ease;
  transform: rotate(${(props) => (props.$expanded ? "90deg" : "0deg")});
  color: var(--color-muted);
`;

const CollapsibleBody = styled.div`
  display: grid;
  gap: 12px;
  padding: 0 20px 20px;
`;

const LimitModal = styled(SuccessModal)`
  max-width: 460px;
`;

type Option = { value: string; label: string };
type OptionDefinition = { value: string; labelKey: string };

const dealTypeOptions: OptionDefinition[] = [
  { value: "sale", labelKey: "requestSale.dealType.sale" },
  { value: "rent", labelKey: "requestSale.dealType.rent" },
];

const propertyTypeOptions = propertyTypeDefinitions;

const currencyOptions: Option[] = [
  { value: "MMK", label: "MMK" },
  { value: "USD", label: "USD" },
  { value: "CNY", label: "CNY" },
  { value: "THB", label: "THB" },
];

const stepKeys = [
  "requestSale.steps.basics",
  "requestSale.steps.location",
  "requestSale.steps.details",
  "requestSale.steps.pricing",
  "requestSale.steps.contact",
];

const propertyGroupOrder = ["residential", "commercial", "industrial", "special"] as const;

const propertyGroupLabels: Record<(typeof propertyGroupOrder)[number], string> = {
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  special: "Special",
};

const MYANMAR_CENTER: [number, number] = [21.9162, 95.956];
const DEFAULT_ZOOM = 6;

const RequestSaleMap = dynamic(() => import("./RequestSaleMap"), { ssr: false });

type FormState = {
  title: string;
  description: string;
  deal_type: string;
  property_type: PropertyType | "";
  price: string;
  currency: string;
  state_region: string;
  district: string;
  city: string;
  township: string;
  address_text: string;
  bedrooms: string;
  bathrooms: string;
  area_sqft: string;
  floor_count: string;
  room_count: string;
  has_lift: boolean;
  has_backup_power: boolean;
  backup_power_type: "solar" | "generator" | "solar_generator" | "";
  has_parking: boolean;
  latitude: string;
  longitude: string;
  
  // New contact fields
  contact_source: "agency_profile" | "custom_contact" | "direct_owner";
  listing_contact_name: string;
  listing_contact_phone: string;
  listing_contact_phone_secondary: string;
  owner_name: string;
  owner_phone: string;
  owner_phone_secondary: string;
  owner_note: string;
  
  // Legacy toggle (for backward compatibility)
  useAgencyContact: boolean;
};

type WorkspaceLimits = {
  vendor?: {
    plan?: string | null;
  };
  limits?: {
    currentPlan?: {
      name: string;
    };
    listingCount?: number;
    listingLimit?: number;
    listingNearLimit?: boolean;
    listingOverLimit?: boolean;
    suggestedUpgrade?: {
      name: string;
      priceLabel: string;
    } | null;
  };
};

const initialState: FormState = {
  title: "",
  description: "",
  deal_type: "sale",
  property_type: "",
  price: "",
  currency: "MMK",
  state_region: "",
  district: "",
  city: "",
  township: "",
  address_text: "",
  bedrooms: "",
  bathrooms: "",
  area_sqft: "",
  floor_count: "",
  room_count: "",
  has_lift: false,
  has_backup_power: false,
  backup_power_type: "",
  has_parking: false,
  latitude: "",
  longitude: "",
  
  // New contact fields
  contact_source: "agency_profile",
  listing_contact_name: "",
  listing_contact_phone: "",
  listing_contact_phone_secondary: "",
  owner_name: "",
  owner_phone: "",
  owner_phone_secondary: "",
  owner_note: "",
  
  // Legacy toggle
  useAgencyContact: false,
};

const toNullableNumber = (value: string) => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toNullableString = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const toFormNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
};

const toBackupPowerType = (value: unknown): FormState["backup_power_type"] => {
  if (value === "solar" || value === "generator" || value === "solar_generator") {
    return value;
  }
  return "";
};

const REQUEST_TITLE_MAX_LENGTH = 80;
const REQUEST_TITLE_MAX_WORDS = 20;
const REQUEST_ADDRESS_MIN_LENGTH = 8;

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

const validateTitle = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "Title is required.";
  if (trimmed.length > REQUEST_TITLE_MAX_LENGTH) return `Keep the title under ${REQUEST_TITLE_MAX_LENGTH} characters.`;
  if (countWords(trimmed) > REQUEST_TITLE_MAX_WORDS) return `Keep the title under ${REQUEST_TITLE_MAX_WORDS} words.`;
  return null;
};

const validateDescription = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "Description is required.";
  return null;
};

const validateAddressText = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "Address is required.";
  if (trimmed.length < REQUEST_ADDRESS_MIN_LENGTH) return "Add a clearer address or landmark.";
  return null;
};

const validatePrice = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "Price is required.";
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return "Enter a valid price.";
  return null;
};

const validatePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "Phone number is required.";
  if (digits.length < 7) return "Enter a valid phone number.";
  return null;
};

const toStoredPrice = (value: string, currency: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return currency === "MMK" ? parsed * 100000 : parsed;
};

const fromStoredPrice = (value: unknown, currency: string) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return currency === "MMK" ? String(value / 100000) : String(value);
};

const validatePositiveCount = (value: string, label: string) => {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return `Enter a valid ${label.toLowerCase()}.`;
  return null;
};

const validateOptionalPositiveCount = (value: string, label: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return `Enter a valid ${label.toLowerCase()}.`;
  return null;
};

const isValidLatitude = (value: number) => Number.isFinite(value) && value >= -90 && value <= 90;
const isValidLongitude = (value: number) => Number.isFinite(value) && value >= -180 && value <= 180;

const liftEligiblePropertyTypes = new Set<PropertyType>([
  "apartment",
  "mini_condo",
  "condo",
  "serviced_apartment",
  "office",
  "shop_office",
  "hotel",
  "project",
]);

const bathroomEligiblePropertyTypes = new Set<PropertyType>([
  "house",
  "apartment",
  "mini_condo",
  "condo",
  "serviced_apartment",
  "shop",
  "office",
  "shop_office",
  "hotel",
  "restaurant",
]);

const parkingEligiblePropertyTypes = new Set<PropertyType>([
  "house",
  "apartment",
  "mini_condo",
  "condo",
  "serviced_apartment",
  "shop",
  "office",
  "shop_office",
  "hotel",
  "restaurant",
  "marketplace",
  "warehouse",
  "industrial",
  "project",
]);

const backupEligiblePropertyTypes = new Set<PropertyType>([
  "house",
  "apartment",
  "mini_condo",
  "condo",
  "serviced_apartment",
  "shop",
  "office",
  "shop_office",
  "hotel",
  "restaurant",
  "marketplace",
  "warehouse",
  "industrial",
  "project",
]);

const floorCountRequiredPropertyTypes = new Set<PropertyType>(["house", "hotel"]);
const roomCountRequiredPropertyTypes = new Set<PropertyType>(["hotel"]);
const bedroomRequiredPropertyTypes = new Set<PropertyType>([
  "house",
  "apartment",
  "mini_condo",
  "condo",
  "serviced_apartment",
]);
const bathroomRequiredPropertyTypes = new Set<PropertyType>([
  "house",
  "apartment",
  "mini_condo",
  "condo",
  "serviced_apartment",
]);

function RequestSalePageContent() {
  const { user, profileRole, profileReady, authToken } = useAppState();
  const t = requestSaleText;
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const isEdit = Boolean(editId);
  const fieldId = useId();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successListingId, setSuccessListingId] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [editLockedMessage, setEditLockedMessage] = useState<string | null>(null);
  const [existingRequestCount, setExistingRequestCount] = useState(0);
  const [workspaceLimits, setWorkspaceLimits] = useState<WorkspaceLimits["limits"] | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [mapActive, setMapActive] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapHelpOpen, setMapHelpOpen] = useState(false);
  const [latLngOpen, setLatLngOpen] = useState(false);
  const [limitPopup, setLimitPopup] = useState<string | null>(null);
  const [moderationPopup, setModerationPopup] = useState<string | null>(null);
  const [locateAttempted, setLocateAttempted] = useState(false);
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(MYANMAR_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [showPrivateOwner, setShowPrivateOwner] = useState(false);
  const [useAgencyContact, setUseAgencyContact] = useState(false);
  const [attention, setAttention] = useState(false);
  const [stepAttempted, setStepAttempted] = useState<Record<number, boolean>>({});
  const stepItems = useMemo(
    () => [
      { key: stepKeys[0], label: t(stepKeys[0]), icon: Home },
      { key: stepKeys[1], label: t(stepKeys[1]), icon: MapPin },
      { key: stepKeys[2], label: t(stepKeys[2]), icon: Building2 },
      { key: stepKeys[3], label: t(stepKeys[3]), icon: BadgeDollarSign },
      { key: stepKeys[4], label: t(stepKeys[4]), icon: UserRound },
    ],
    [t]
  );
  const localizedDealTypeOptions = useMemo<Option[]>(
    () => dealTypeOptions.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  );
  const propertyTiles = useMemo(
    () =>
      propertyTypeOptions.map((option) => ({
        key: option.value,
        group: option.group,
        label: formatPropertyTypeValue(option.value, t),
        icon:
          option.value === "land"
            ? MapPin
            : option.value === "house"
              ? Home
              : option.value === "condo"
                ? TowerControl
                : option.value === "shop" || option.value === "office" || option.value === "shop_office" || option.value === "marketplace"
                  ? Store
                  : option.value === "hotel" || option.value === "restaurant"
                    ? Hotel
                    : option.value === "warehouse" || option.value === "industrial"
                      ? Warehouse
                      : Building2,
      })),
    [t]
  );
  const propertyGroups = useMemo(
    () =>
      propertyGroupOrder.map((group) => ({
        key: group,
        label: propertyGroupLabels[group],
        items: propertyTiles.filter((item) => item.group === group),
      })),
    [propertyTiles]
  );
  const prevLocationRef = useRef({
    state_region: "",
    district: "",
    township: "",
  });
  const vendorReturnPath = "/hub";
  const isVendorFlow =
    profileRole === "vendor_user" || profileRole === "staff" || profileRole === "admin" || profileRole === "master_admin";
const currentPlan = getVendorPlan(workspaceLimits?.currentPlan?.name ?? 'free');
  const vendorImageLimit = currentPlan.imageLimit;
  const upgradePlan = getUpgradePlan(currentPlan.key);
  const maxImageCount = isVendorFlow ? vendorImageLimit : 5;
  const customerLimitReached = !isVendorFlow && !isEdit && existingRequestCount >= 1;

  useEffect(() => {
    if (!authToken || profileRole !== "vendor_user") return;

    let cancelled = false;
    const loadWorkspaceLimits = async () => {
      const response = await fetch("/api/vendor/workspace", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const payload = (await response.json().catch(() => null)) as WorkspaceLimits | null;
      if (!cancelled && response.ok) {
        setWorkspaceLimits(payload?.limits ?? null);
      }
    };

    void loadWorkspaceLimits();
    return () => {
      cancelled = true;
    };
  }, [authToken, profileRole]);

  useEffect(() => {
    if (!editId || !user?.id) return;
    let active = true;
    setLoadingEdit(true);
    setEditLockedMessage(null);
    const loader = isVendorFlow
      ? getSalesRequestById(user.id, editId).then(({ request, error }) => ({ record: request, error }))
      : getOwnedPropertyById(user.id, editId).then(({ property, error }) => ({ record: property, error }));
    loader.then(({ record, error: loadError }) => {
        if (!active) return;
        if (loadError) {
          setError(loadError);
          return;
        }
        if (!record) {
          setError(t("requestSale.error.load"));
          return;
        }
        if (isVendorFlow && isReviewLocked(record.review_status)) {
          setEditLockedMessage("This property request is under review and cannot be edited right now.");
          router.replace("/account");
          return;
        }
        const requestCurrency = String(record.currency ?? "MMK");
        setForm({
          title: String(record.title ?? ""),
          description: String(record.description ?? ""),
          deal_type: String(record.deal_type ?? "sale"),
          property_type: normalizeSelectablePropertyType(String(record.property_type ?? "house")),
          price: fromStoredPrice(record.price, requestCurrency),
          currency: requestCurrency,
          state_region: String(record.state_region ?? ""),
          district: String(record.district ?? ""),
          city: String(record.city ?? ""),
          township: String(record.township ?? ""),
          address_text: String(record.address_text ?? ""),
          bedrooms: toFormNumber(record.bedrooms),
          bathrooms: toFormNumber(record.bathrooms),
          area_sqft: toFormNumber(record.area_sqft),
          floor_count: toFormNumber(record.floor_count),
          room_count: toFormNumber(record.room_count),
          has_lift: Boolean(record.has_lift),
          has_backup_power: Boolean(record.has_backup_power),
          backup_power_type: toBackupPowerType(record.backup_power_type),
          has_parking: Boolean(record.has_parking),
          latitude: toFormNumber(record.latitude),
          longitude: toFormNumber(record.longitude),
          
          // Backward compatibility - map old data
          contact_source: record.owner_name ? "direct_owner" : "agency_profile",
          listing_contact_name: String(record.owner_name ?? ""),
          listing_contact_phone: String(record.owner_phone ?? ""),
          listing_contact_phone_secondary: String(record.owner_phone_secondary ?? ""),
          owner_name: String(record.owner_name ?? ""),
          owner_phone: String(record.owner_phone ?? ""),
          owner_phone_secondary: String(record.owner_phone_secondary ?? ""),
          owner_note: "",
          useAgencyContact: false,
        });
      })
      .finally(() => {
        if (active) setLoadingEdit(false);
      });

    return () => {
      active = false;
    };
  }, [editId, isVendorFlow, router, user?.id, t]);

  useEffect(() => {
    if (!user?.id || isVendorFlow) {
      setExistingRequestCount(0);
      return;
    }

    let active = true;
    getOwnedPropertiesForUser(user.id).then(({ data }) => {
      if (!active) return;
      setExistingRequestCount(data.length);
    });

    return () => {
      active = false;
    };
  }, [isVendorFlow, user?.id]);

  const selectedPropertyType = form.property_type || null;
  const showBedrooms = isBedBathPropertyType(selectedPropertyType);
  const showBathrooms =
    Boolean(selectedPropertyType) && bathroomEligiblePropertyTypes.has(selectedPropertyType as PropertyType);
  const showFloorCount =
    Boolean(selectedPropertyType) && floorCountRequiredPropertyTypes.has(selectedPropertyType as PropertyType);
  const showRoomCount =
    Boolean(selectedPropertyType) && roomCountRequiredPropertyTypes.has(selectedPropertyType as PropertyType);
  const showLift =
    Boolean(selectedPropertyType) && liftEligiblePropertyTypes.has(selectedPropertyType as PropertyType);
  const showParking =
    Boolean(selectedPropertyType) && parkingEligiblePropertyTypes.has(selectedPropertyType as PropertyType);
  const showBackupPower =
    Boolean(selectedPropertyType) && backupEligiblePropertyTypes.has(selectedPropertyType as PropertyType);
  const locationReady = Boolean(form.state_region && form.district && form.township);
  const titleError = validateTitle(form.title);
  const descriptionError = validateDescription(form.description);
  const propertyTypeError = form.property_type ? null : "Property type is required.";
  const imageError = !isEdit && imageFiles.length === 0 ? "At least 1 property image is required." : null;
  const addressTextError = validateAddressText(form.address_text);
  const mapPinError = isUsableMapCoordinate(Number(form.latitude), Number(form.longitude))
    ? null
    : "Place a pin on the map or use lat/lng.";
  const areaError = form.area_sqft.trim() ? null : "Area is required.";
  const bedroomsError = showBedrooms
    ? bedroomRequiredPropertyTypes.has(selectedPropertyType as PropertyType)
      ? validatePositiveCount(form.bedrooms, "Bedroom count")
      : validateOptionalPositiveCount(form.bedrooms, "Bedroom count")
    : null;
  const bathroomsError = showBathrooms
    ? bathroomRequiredPropertyTypes.has(selectedPropertyType as PropertyType)
      ? validatePositiveCount(form.bathrooms, "Bathroom count")
      : validateOptionalPositiveCount(form.bathrooms, "Bathroom count")
    : null;
  const floorCountError = showFloorCount ? validatePositiveCount(form.floor_count, "Floor count") : null;
  const roomCountError = showRoomCount ? validatePositiveCount(form.room_count, "Room count") : null;
  const priceError = validatePrice(form.price);
  const isAgencyContact = isVendorFlow && useAgencyContact;
  const ownerNameError = isAgencyContact || form.owner_name.trim() ? null : t("requestSale.contactNameLabel") + " is required.";
  const ownerPhoneError = isAgencyContact ? null : validatePhone(form.owner_phone);
  // Contact validation (must be before stepValidity)
  const listingContactNameError = (form.contact_source === "custom_contact" || !isVendorFlow) && !form.listing_contact_name.trim() 
    ? t("requestSale.listingContactNameError") : null;
  const listingContactPhoneError = (form.contact_source === "custom_contact" || !isVendorFlow) && !form.listing_contact_phone.trim()
    ? t("requestSale.primaryPhoneError") : null;
  
  const contactError = listingContactNameError || listingContactPhoneError;
  
  const priceLabel = form.currency === "MMK" ? t("requestSale.priceLabel") : `Price (${form.currency})`;
  const imagePreviews = useMemo(() => imageFiles.map((file) => URL.createObjectURL(file)), [imageFiles]);
  useEffect(
    () => () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    },
    [imagePreviews]
  );
  const stepValidity = useMemo(
    () => [
      !titleError && !descriptionError && !propertyTypeError && !imageError && Boolean(form.deal_type),
      Boolean(form.state_region.trim()) &&
        Boolean(form.district.trim()) &&
        Boolean(form.township.trim()) &&
        !addressTextError &&
        !mapPinError,
      !areaError && !bedroomsError && !bathroomsError && !floorCountError && !roomCountError,
      !priceError && Boolean(form.currency),
      !contactError,
    ],
    [
      addressTextError,
      areaError,
      bathroomsError,
      bedroomsError,
      contactError,
      descriptionError,
      floorCountError,
      form.currency,
      form.deal_type,
      form.district,
      form.state_region,
      form.township,
      mapPinError,
      priceError,
      propertyTypeError,
      imageError,
      roomCountError,
      titleError,
    ]
  );

  const getStepStatus = (index: number): "default" | "error" | "success" => {
    if (index <= step && stepValidity[index]) return "success";
    if (stepAttempted[index] || index === step) return "error";
    return "default";
  };

  const backupTiles = useMemo(
    () => [
      { key: "solar", label: t("requestSale.backupPower.solar"), icon: Sun },
      { key: "generator", label: t("requestSale.backupPower.generator"), icon: BatteryCharging },
    ],
    [t]
  );

  const states = useMemo(() => getStates(), []);
  const districts = useMemo(
    () => getDistricts(form.state_region),
    [form.state_region]
  );
  const townships = useMemo(
    () => getTownships(form.state_region, form.district),
    [form.state_region, form.district]
  );

  useEffect(() => {
    if (!locationReady) return;
    const timeout = setTimeout(() => setAttention(false), 700);
    setAttention(true);
    return () => clearTimeout(timeout);
  }, [locationReady]);

  useEffect(() => {
    if (!selectedPropertyType) return;
    setForm((current) => ({
      ...current,
      bedrooms: showBedrooms ? current.bedrooms : "",
      bathrooms: showBathrooms ? current.bathrooms : "",
      floor_count: showFloorCount ? current.floor_count : "",
      room_count: showRoomCount ? current.room_count : "",
      has_lift: showLift ? current.has_lift : false,
      has_parking: showParking ? current.has_parking : false,
      has_backup_power: showBackupPower ? current.has_backup_power : false,
      backup_power_type: showBackupPower ? current.backup_power_type : "",
    }));
  }, [
    selectedPropertyType,
    showBackupPower,
    showBathrooms,
    showBedrooms,
    showFloorCount,
    showLift,
    showParking,
    showRoomCount,
  ]);

  useEffect(() => {
    const prev = prevLocationRef.current;
    const hasChanged =
      prev.state_region &&
      (prev.state_region !== form.state_region ||
        prev.district !== form.district ||
        prev.township !== form.township);

    if (hasChanged) {
      setMapActive(false);
      setMapLoading(false);
      setLocateAttempted(false);
      setMapPosition(null);
      setMapCenter(MYANMAR_CENTER);
      setMapZoom(DEFAULT_ZOOM);
      setForm((current) => ({ ...current, latitude: "", longitude: "" }));
    }

    prevLocationRef.current = {
      state_region: form.state_region,
      district: form.district,
      township: form.township,
    };
  }, [form.state_region, form.district, form.township]);

  useEffect(() => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (isUsableMapCoordinate(lat, lng)) {
      setMapPosition([lat, lng]);
      setMapCenter([lat, lng]);
      setMapZoom(14);
      return;
    }
    if (!mapActive) {
      setMapPosition(null);
    }
  }, [form.latitude, form.longitude, mapActive]);

  const handleLocateOnMap = async () => {
    if (!locationReady) return;
    setMapError(null);
    setMapHelpOpen(false);
    setMapLoading(true);
    setMapActive(false);
    setLocateAttempted(true);

    const query = `${form.township}, ${form.district}, ${form.state_region}, Myanmar`;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          query
        )}`
      );
      const result = await response.json();
      const first = result?.[0];
      if (!first) {
        setMapError(t("requestSale.error.locationNotFound"));
        setMapHelpOpen(true);
        return;
      }
      const lat = Number(first.lat);
      const lng = Number(first.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setMapError(t("requestSale.error.locationNotFound"));
        setMapHelpOpen(true);
        return;
      }
      setMapPosition([lat, lng]);
      setMapCenter([lat, lng]);
      setMapZoom(14);
      setMapActive(true);
      setMapHelpOpen(false);
      setForm((current) => ({
        ...current,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));
    } catch {
      setMapError(t("requestSale.error.locate"));
      setMapHelpOpen(true);
    } finally {
      setMapLoading(false);
    }
  };

  const geocodeLocation = async (queries: Array<{ query: string; zoom: number }>) => {
    for (const entry of queries) {
      const trimmed = entry.query.trim();
      if (!trimmed) continue;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`
      );
      const result = await response.json();
      const first = result?.[0];
      const lat = Number(first?.lat);
      const lng = Number(first?.lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { center: [lat, lng] as [number, number], zoom: entry.zoom };
      }
    }
    return null;
  };

  const handleOpenMapManual = async () => {
    setMapError(null);
    setMapHelpOpen(false);
    setMapLoading(false);
    setLocateAttempted(true);
    setMapActive(true);

    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (isUsableMapCoordinate(lat, lng)) {
      setMapPosition([lat, lng]);
      setMapCenter([lat, lng]);
      setMapZoom(14);
      return;
    }

    if (form.latitude || form.longitude) {
      setForm((current) => ({
        ...current,
        latitude: "",
        longitude: "",
      }));
      setMapPosition(null);
    }

    const areaCenter = await geocodeLocation([
      { query: `${form.state_region}, Myanmar`, zoom: 8 },
      { query: "Yangon, Myanmar", zoom: 11 },
    ]);

    if (areaCenter) {
      setMapCenter(areaCenter.center);
      setMapZoom(areaCenter.zoom);
      return;
    }

    if (!mapPosition) {
      setMapCenter(MYANMAR_CENTER);
      setMapZoom(DEFAULT_ZOOM);
      setMapError("Map opened in Myanmar default view. Move the map and place the pin manually.");
    }
  };

  const handleUseLatLng = async () => {
    setMapError(null);
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!isValidLatitude(lat) || !isValidLongitude(lng)) {
      setMapError(t("requestSale.error.latLng"));
      return;
    }

    setMapPosition([lat, lng]);
    setMapCenter([lat, lng]);
    setMapZoom(14);
    setMapActive(true);
    setForm((current) => ({
      ...current,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
    setLatLngOpen(false);
  };

  const handleMapSelect = (lat: number, lng: number) => {
    setMapError(null);
    setMapActive(true);
    setLocateAttempted(true);
    setForm((current) => ({
      ...current,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
    setMapPosition([lat, lng]);
    setMapCenter([lat, lng]);
    setMapZoom(14);
    setLatLngOpen(false);
  };

  const handleImagePick = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!nextFiles.length) return;
    setImageFiles((current) => [...current, ...nextFiles].slice(0, maxImageCount));
    event.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleTitleChange = (rawValue: string) => {
    const words = rawValue.trim().split(/\s+/).filter(Boolean);
    if (words.length > REQUEST_TITLE_MAX_WORDS) {
      const trimmedValue = words.slice(0, REQUEST_TITLE_MAX_WORDS).join(" ");
      setField("title", trimmedValue);
      setLimitPopup(`Title is limited to ${REQUEST_TITLE_MAX_WORDS} words.`);
      return;
    }
    setField("title", rawValue);
  };

  const handleDescriptionChange = (rawValue: string) => {
    if (rawValue.length > REQUEST_DESCRIPTION_MAX_LENGTH) {
      setField("description", rawValue.slice(0, REQUEST_DESCRIPTION_MAX_LENGTH));
      setLimitPopup(`Description is limited to ${REQUEST_DESCRIPTION_MAX_LENGTH} characters.`);
      return;
    }
    setField("description", rawValue);
  };

  const handleNext = () => {
    setError(null);
    setStepAttempted((current) => ({ ...current, [step]: true }));
    if (!stepValidity[step]) {
      if (step === 0) {
        setError(titleError || descriptionError || propertyTypeError || imageError || "Complete the basics before continuing.");
      } else if (step === 1) {
        setError(
          !form.state_region.trim() || !form.district.trim() || !form.township.trim()
            ? t("requestSale.error.locationRequired")
          : addressTextError || mapPinError || "Complete the address and map pin before continuing."
        );
      } else if (step === 2) {
        setError(
          areaError ||
            bedroomsError ||
            bathroomsError ||
            floorCountError ||
            roomCountError ||
            "Complete the required details before continuing."
        );
      } else if (step === 3) {
        setError(priceError || t("requestSale.error.priceRequired"));
      } else if (step === 4) {
        setError(ownerNameError || ownerPhoneError || "Add the contact person details.");
      }
      return;
    }
    setStep((prev) => Math.min(stepKeys.length - 1, prev + 1));
  };

  const handleSubmit = async () => {
    setError(null);
    setStepAttempted({ 0: true, 1: true, 2: true, 3: true, 4: true });
    if (!stepValidity.every(Boolean)) {
      setError(
        titleError ||
          descriptionError ||
          propertyTypeError ||
          addressTextError ||
          mapPinError ||
          areaError ||
          bedroomsError ||
          bathroomsError ||
          floorCountError ||
          priceError ||
          roomCountError ||
          ownerNameError ||
          ownerPhoneError ||
          t("requestSale.error.completeRequired")
      );
      return;
    }
    if (form.has_backup_power && !form.backup_power_type) {
      setError(t("requestSale.error.backupRequired"));
      return;
    }

    const moderationResult = moderateListingText({
      title: form.title,
      description: form.description,
    });
    if (moderationResult.blocked) {
      setModerationPopup(
        moderationResult.message ||
          "Your title or description contains prohibited or suspicious wording. Remove profanity, drug-sale language, or spam/contact promotion and try again."
      );
      setStep(0);
      return;
    }

    const payload = {
      user_id: user?.id ?? null,
      title: form.title.trim(),
      description: toNullableString(form.description),
      deal_type: form.deal_type,
      property_type: form.property_type as PropertyType,
      price: toStoredPrice(form.price, form.currency),
      currency: form.currency,
      state_region: form.state_region.trim(),
      district: toNullableString(form.district),
      city: toNullableString(form.city),
      township: form.township.trim(),
      address_text: toNullableString(form.address_text),
      bedrooms: showBedrooms ? toNullableNumber(form.bedrooms) : null,
      bathrooms: showBathrooms ? toNullableNumber(form.bathrooms) : null,
      area_sqft: toNullableNumber(form.area_sqft),
      floor_count: showFloorCount ? toNullableNumber(form.floor_count) : null,
      room_count: showRoomCount ? toNullableNumber(form.room_count) : null,
      commission_percent: null,
      has_lift: showLift ? form.has_lift : false,
      has_backup_power: showBackupPower ? form.has_backup_power : false,
      backup_power_type: showBackupPower ? form.backup_power_type || null : null,
      has_parking: showParking ? form.has_parking : false,
      latitude: toNullableNumber(form.latitude),
      longitude: toNullableNumber(form.longitude),
      
      // New contact fields (public first, private second)
      contact_source: form.contact_source,
      listing_contact_name: toNullableString(form.listing_contact_name),
      listing_contact_phone: toNullableString(form.listing_contact_phone),
      listing_contact_phone_secondary: toNullableString(form.listing_contact_phone_secondary),
      owner_name: toNullableString(form.owner_name),
      owner_phone: toNullableString(form.owner_phone),
      owner_phone_secondary: toNullableString(form.owner_phone_secondary),
      owner_note: toNullableString(form.owner_note),
    };

    setSubmitting(true);
    if (isEdit && editId) {
      if (!user?.id) {
        setSubmitting(false);
        setError(t("requestSale.error.signIn"));
        return;
      }
      const updateInput = {
        id: editId,
        userId: user.id,
        title: form.title.trim(),
        description: toNullableString(form.description),
        dealType: form.deal_type,
        propertyType: form.property_type as PropertyType,
        price: toStoredPrice(form.price, form.currency),
        currency: form.currency,
        stateRegion: form.state_region.trim(),
        district: toNullableString(form.district),
        city: toNullableString(form.city),
        township: form.township.trim(),
        addressText: toNullableString(form.address_text),
        bedrooms: showBedrooms ? toNullableNumber(form.bedrooms) : null,
        bathrooms: showBathrooms ? toNullableNumber(form.bathrooms) : null,
        areaSqft: toNullableNumber(form.area_sqft),
        floorCount: showFloorCount ? toNullableNumber(form.floor_count) : null,
        roomCount: showRoomCount ? toNullableNumber(form.room_count) : null,
        hasLift: showLift ? form.has_lift : false,
        hasBackupPower: showBackupPower ? form.has_backup_power : false,
        backupPowerType: showBackupPower ? form.backup_power_type || null : null,
        hasParking: showParking ? form.has_parking : false,
        latitude: toNullableNumber(form.latitude),
        longitude: toNullableNumber(form.longitude),
        ownerName: toNullableString(form.owner_name),
        ownerPhone: toNullableString(form.owner_phone),
        ownerPhoneSecondary: toNullableString(form.owner_phone_secondary),
      };
      const result = await (isVendorFlow ? updateSalesRequest(updateInput) : updateOwnedProperty(updateInput));
      setSubmitting(false);
      if (!result.ok) {
        setError(result.message ?? t("requestSale.error.updateFailed"));
        return;
      }
      setSuccessListingId(editId);
    } else {
      const endpoint = profileRole === "vendor_user" ? "/api/vendor/sales-requests" : "/api/public/sales-requests";
      const headers: Record<string, string> = {};
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const requestBody = new FormData();
      requestBody.set("payload", JSON.stringify(payload));
      for (const file of imageFiles) {
        requestBody.append("images", file);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: requestBody,
      });
      setSubmitting(false);

      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
        setError(result.message ?? result.error ?? t("requestSale.error.submitFailed"));
        return;
      }
      const result = (await response.json().catch(() => null)) as { propertyId?: string } | null;
      setSuccessListingId(result?.propertyId ?? null);
    }

    setSuccess(true);
    setForm(initialState);
    setImageFiles([]);
    setStep(0);
    setStepAttempted({});
  };

  const setField = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (!user) {
    return (
      <div>
        <MarketplaceHeader />
        <PageShell>
          <SectionTitle>{t("requestSale.titleNew")}</SectionTitle>
          <Panel>
            <Muted>{t("requestSale.signInPrompt")}</Muted>
            <PrimaryButton type="button" onClick={() => router.push("/auth")}>
              {t("requestSale.signInContinue")}
            </PrimaryButton>
          </Panel>
        </PageShell>
      </div>
    );
  }

  if (!profileReady && isEdit) {
    return (
      <div>
        <MarketplaceHeader />
        <PageShell>
          <Panel>
            <Muted>Loading request details…</Muted>
          </Panel>
        </PageShell>
      </div>
    );
  }

  return (
    <div>
      <MarketplaceHeader />
      <PageShell>
        <TitleRow>
          <SectionTitle>
            {isEdit
              ? profileRole === "vendor_user"
                ? t("requestSale.titleEdit")
                : "Edit listing"
              : profileRole === "vendor_user"
                ? t("requestSale.titleNew")
                : "Create a listing"}
          </SectionTitle>
          <BackButton type="button" onClick={() => router.back()}>
            {t("common.back")}
          </BackButton>
        </TitleRow>
        <Muted>
          {isEdit
            ? profileRole === "vendor_user"
              ? t("requestSale.subtitleEdit")
              : "Update your property listing details."
            : profileRole === "vendor_user"
              ? t("requestSale.subtitleNew")
              : "Publish your property directly to the marketplace."}
        </Muted>
        {!isVendorFlow ? (
          <LimitNotice $danger={customerLimitReached}>
            {customerLimitReached
              ? "You already used your 1 published listing for this account."
              : `1 published listing per account. Current usage: ${existingRequestCount}/1.`}
          </LimitNotice>
        ) : null}
        {workspaceLimits?.listingNearLimit ? (
          <LimitNotice $danger={workspaceLimits.listingOverLimit}>
            {workspaceLimits.listingOverLimit
              ? "Your workspace is already above its current listing soft limit. Submission stays open for now, but the next billing phase should turn this into an upgrade or cleanup path."
              : `You are close to your current ${workspaceLimits.currentPlan?.name || "plan"} limit: ${workspaceLimits.listingCount ?? 0}/${workspaceLimits.listingLimit ?? 0} listings. ${
                  workspaceLimits.suggestedUpgrade
                    ? `Recommended upgrade: ${workspaceLimits.suggestedUpgrade.name} (${workspaceLimits.suggestedUpgrade.priceLabel}).`
                    : ""
                }`}
          </LimitNotice>
        ) : null}
        <Stepper>
          {stepItems.map((item, index) => (
            <StepPill
              key={item.key}
              $active={index === step}
              $completed={index <= step && stepValidity[index]}
              $status={getStepStatus(index)}
            >
              {index < step ? (
                <CheckCircle2 size={14} />
              ) : (
                <StepIconWrap>
                  <item.icon />
                </StepIconWrap>
              )}
              {item.label}
            </StepPill>
          ))}
        </Stepper>

        <FormCard>
          {step === 0 && (
            <>
              {!isEdit ? (
                <>
                  <HiddenFileInput
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagePick}
                  />
                  <UploadHint>
                    Add at least 1 photo. Up to {maxImageCount} image{maxImageCount > 1 ? "s" : ""}. The first image is the cover.
                  </UploadHint>
{isVendorFlow && vendorImageLimit === 5 && upgradePlan && imageFiles.length >= vendorImageLimit && (
                    <UpgradeImageSlotNotice>
                      +{upgradePlan.imageLimit - vendorImageLimit} more slots with <UpgradeLink href="/hub/upgrade">Pro upgrade</UpgradeLink>
                    </UpgradeImageSlotNotice>
                  )}
                  {stepAttempted[0] && imageError ? <ErrorText>{imageError}</ErrorText> : null}
  <UploadStrip>
    {Array.from({ length: maxImageCount }, (_, index) => {
      const file = imageFiles[index] ?? null;
      const preview = imagePreviews[index] ?? null;
      return (
        <UploadSlot
          key={`image-slot-${index}`}
          role="button"
          tabIndex={0}
          $filled={Boolean(file)}
          $image={preview}
          onClick={() => {
            if (!file) imageInputRef.current?.click();
          }}
          onKeyDown={(event) => {
            if (file) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              imageInputRef.current?.click();
            }
          }}
        >
          {file ? (
            <>
              <RemoveImageButton
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleRemoveImage(index);
                }}
              >
                x
              </RemoveImageButton>
              <UploadSlotOverlay $filled>
                <UploadSlotInner>
                  <strong style={{ color: "#fff" }}>{index === 0 ? "Cover" : `Photo ${index + 1}`}</strong>
                </UploadSlotInner>
              </UploadSlotOverlay>
            </>
          ) : (
            <UploadSlotInner>
              <ImagePlus size={18} />
              <strong>Add photo</strong>
              <span>Slot {index + 1}</span>
            </UploadSlotInner>
          )}
        </UploadSlot>
      );
    })}
    {isVendorFlow && vendorImageLimit === 5 && upgradePlan && (
        <PaidUpgradeSlot href="/hub/upgrade">
          <UpgradeSlotInner>
            <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
            <span>More slots</span>
            <UpgradeLink>Upgrade →</UpgradeLink>
          </UpgradeSlotInner>
        </PaidUpgradeSlot>
    )}
  </UploadStrip>
                </>
              ) : null}
              <CustomInput
                id={`${fieldId}-title`}
                label={t("requestSale.titleLabel")}
                name="title"
                value={form.title}
                onChange={(event) => handleTitleChange(event.target.value)}
                maxLength={REQUEST_TITLE_MAX_LENGTH}
                error={stepAttempted[0] ? titleError : null}
                status={form.title.trim() && !titleError ? "success" : "default"}
              />
              <CustomTextarea
                id={`${fieldId}-description`}
                label={t("requestSale.descriptionLabel")}
                name="description"
                value={form.description}
                onChange={(event) => handleDescriptionChange(event.target.value)}
                maxLength={REQUEST_DESCRIPTION_MAX_LENGTH}
                error={stepAttempted[0] ? descriptionError : null}
                status={form.description.trim() && !descriptionError ? "success" : "default"}
              />
              <CustomSelect
                id={`${fieldId}-deal-type`}
                label={t("requestSale.dealTypeLabel")}
                name="deal_type"
                value={form.deal_type}
                onChange={(value) => setField("deal_type", value)}
                status={form.deal_type ? "success" : "default"}
              >
                {localizedDealTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </CustomSelect>
              <PropertyGroups>
                {propertyGroups.map((group) => (
                  <PropertyGroup key={group.key}>
                    <PropertyGroupLabel>{group.label}</PropertyGroupLabel>
                    <TileGrid>
                      {group.items.map((tile) => (
                        <Tile
                          key={tile.key}
                          type="button"
                          $active={form.property_type === tile.key}
                          $status={
                            form.property_type
                              ? form.property_type === tile.key
                                ? "success"
                                : "default"
                              : stepAttempted[0]
                                ? "error"
                                : "default"
                          }
                          onClick={() => setField("property_type", tile.key)}
                        >
                          <tile.icon size={16} />
                          {tile.label}
                        </Tile>
                      ))}
                    </TileGrid>
                  </PropertyGroup>
                ))}
              </PropertyGroups>
              {stepAttempted[0] && propertyTypeError ? <ErrorText>{propertyTypeError}</ErrorText> : null}
            </>
          )}

          {step === 1 && (
            <>
              <CustomSelect
                id={`${fieldId}-state-region`}
                label={t("requestSale.stateRegionLabel")}
                name="state_region"
                value={form.state_region}
                status={form.state_region ? "success" : "default"}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    state_region: value,
                    district: "",
                    township: "",
                  }))
                }
              >
                {states.map((state) => (
                  <option key={state.pcode} value={state.name_en}>
                    {state.name_en}
                  </option>
                ))}
              </CustomSelect>
              <CustomSelect
                id={`${fieldId}-district`}
                label={t("requestSale.cityLabel")}
                name="district"
                value={form.district}
                disabled={!form.state_region}
                status={form.district ? "success" : "default"}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    district: value,
                    township: "",
                  }))
                }
              >
                {districts.map((district) => (
                  <option key={district.pcode} value={district.name_en}>
                    {district.name_en}
                  </option>
                ))}
              </CustomSelect>
              <CustomSelect
                id={`${fieldId}-township`}
                label={t("requestSale.townshipLabel")}
                name="township"
                value={form.township}
                disabled={!form.district}
                status={form.township ? "success" : "default"}
                onChange={(value) => setField("township", value)}
              >
                {townships.map((township) => (
                  <option key={township.pcode} value={township.name_en}>
                    {township.name_en}
                  </option>
                ))}
              </CustomSelect>
              <CustomTextarea
                id={`${fieldId}-address-text`}
                label={t("requestSale.addressLabel")}
                name="address_text"
                value={form.address_text}
                onChange={(event) => setField("address_text", event.target.value)}
                error={stepAttempted[1] ? addressTextError : null}
                status={form.address_text.trim() && !addressTextError ? "success" : "default"}
              />
              <MapActions>
                <MapButton
                  type="button"
                  onClick={handleLocateOnMap}
                  disabled={!locationReady || mapLoading}
                  $attention={locationReady && !mapActive && attention}
                >
                  {t("requestSale.locateOnMap")}
                </MapButton>
                <MapButton type="button" onClick={handleOpenMapManual} disabled={mapLoading}>
                  View on map and select
                </MapButton>
                <LatLngButton type="button" onClick={() => setLatLngOpen(true)} disabled={mapLoading}>
                  {t("requestSale.useLatLng")}
                </LatLngButton>
              </MapActions>
              <MapHelper>{t("requestSale.mapHelper")}</MapHelper>
              {mapActive ? (
                <MapInstruction>
                  Drag the map to your property area, then click the map or drag the marker to place the exact location.
                </MapInstruction>
              ) : null}
              <MapFrame $status={mapPinError ? (stepAttempted[1] ? "error" : "default") : "success"}>
                <MapCanvas $inactive={!mapActive || mapLoading}>
                  <RequestSaleMap
                    center={mapCenter}
                    defaultZoom={mapZoom}
                    active={mapActive}
                    position={mapPosition}
                    onSelect={handleMapSelect}
                  />
                </MapCanvas>
                {(!mapActive || mapLoading) && (
                  <MapOverlay>{mapLoading ? t("common.loading") : "?"}</MapOverlay>
                )}
              </MapFrame>
              {!mapPinError ? <Muted>Map pin added.</Muted> : null}
              {mapError && <ErrorText>{mapError}</ErrorText>}
              {stepAttempted[1] && mapPinError ? <ErrorText>{mapPinError}</ErrorText> : null}
            </>
          )}

          {step === 2 && (
            <>
              <CustomInput
                id={`${fieldId}-area-sqft`}
                label={t("requestSale.areaLabel")}
                name="area_sqft"
                value={form.area_sqft}
                onChange={(event) => setField("area_sqft", event.target.value)}
                error={stepAttempted[2] ? areaError : null}
                status={form.area_sqft.trim() && !areaError ? "success" : "default"}
              />
                  {showFloorCount ? (
                    <CustomInput
                      id={`${fieldId}-floor-count`}
                      label={t("requestSale.floorCountLabel")}
                      name="floor_count"
                      type="number"
                      inputMode="numeric"
                      value={form.floor_count}
                      onChange={(event) => setField("floor_count", event.target.value)}
                      error={stepAttempted[2] ? floorCountError : null}
                      status={form.floor_count.trim() && !floorCountError ? "success" : "default"}
                    />
              ) : null}
                  {showRoomCount ? (
                    <CustomInput
                      id={`${fieldId}-room-count`}
                      label={t("requestSale.roomCountLabel")}
                      name="room_count"
                      type="number"
                      inputMode="numeric"
                      value={form.room_count}
                      onChange={(event) => setField("room_count", event.target.value)}
                      error={stepAttempted[2] ? roomCountError : null}
                      status={form.room_count.trim() && !roomCountError ? "success" : "default"}
                    />
              ) : null}
              {showBedrooms || showBathrooms ? (
                <>
                  {showBedrooms ? (
                    <CustomInput
                      id={`${fieldId}-bedrooms`}
                      label={t("requestSale.bedroomsLabel")}
                      name="bedrooms"
                      type="number"
                      inputMode="numeric"
                      value={form.bedrooms}
                      onChange={(event) => setField("bedrooms", event.target.value)}
                      error={stepAttempted[2] ? bedroomsError : null}
                      status={form.bedrooms.trim() && !bedroomsError ? "success" : "default"}
                    />
                  ) : null}
                  {showBathrooms ? (
                    <CustomInput
                      id={`${fieldId}-bathrooms`}
                      label={t("requestSale.bathroomsLabel")}
                      name="bathrooms"
                      type="number"
                      inputMode="numeric"
                      value={form.bathrooms}
                      onChange={(event) => setField("bathrooms", event.target.value)}
                      error={stepAttempted[2] ? bathroomsError : null}
                      status={form.bathrooms.trim() && !bathroomsError ? "success" : "default"}
                    />
                  ) : null}
                </>
              ) : null}
              {showLift || showParking ? (
                <>
                  <TileGrid>
                    {showLift ? (
                      <Tile
                        type="button"
                        $active={form.has_lift}
                        onClick={() => setField("has_lift", !form.has_lift)}
                      >
                        <TowerControl size={18} />
                        {t("requestSale.lift")}
                      </Tile>
                    ) : null}
                    {showParking ? (
                      <Tile
                        type="button"
                        $active={form.has_parking}
                        onClick={() => setField("has_parking", !form.has_parking)}
                      >
                        <ParkingSquare size={18} />
                        {t("requestSale.parking")}
                      </Tile>
                    ) : null}
                  </TileGrid>
                </>
              ) : null}
              {showBackupPower ? (
                <>
                  <Muted>{t("requestSale.backupPower")}</Muted>
                  <TileGrid>
                    {backupTiles.map((tile) => {
                      const active =
                        form.backup_power_type === tile.key ||
                        form.backup_power_type === "solar_generator";
                      return (
                        <Tile
                          key={tile.key}
                          type="button"
                          $active={active}
                          onClick={() => {
                            const hasSolar =
                              form.backup_power_type === "solar" ||
                              form.backup_power_type === "solar_generator";
                            const hasGenerator =
                              form.backup_power_type === "generator" ||
                              form.backup_power_type === "solar_generator";
                            const nextSolar =
                              tile.key === "solar" ? !hasSolar : hasSolar;
                            const nextGenerator =
                              tile.key === "generator" ? !hasGenerator : hasGenerator;
                            let nextType: FormState["backup_power_type"] = "";
                            if (nextSolar && nextGenerator) nextType = "solar_generator";
                            else if (nextSolar) nextType = "solar";
                            else if (nextGenerator) nextType = "generator";
                            setField("backup_power_type", nextType);
                            setField("has_backup_power", Boolean(nextType));
                          }}
                        >
                          <tile.icon size={18} />
                          {tile.label}
                        </Tile>
                      );
                    })}
                  </TileGrid>
                </>
              ) : null}
            </>
          )}

          {step === 3 && (
            <>
              <CustomInput
                id={`${fieldId}-price`}
                label={priceLabel}
                name="price"
                type="number"
                inputMode="decimal"
                value={form.price}
                onChange={(event) => setField("price", event.target.value)}
                error={stepAttempted[3] ? priceError : null}
                status={form.price.trim() && !priceError ? "success" : "default"}
              />
              <CustomSelect
                id={`${fieldId}-currency`}
                label={t("requestSale.currencyLabel")}
                name="currency"
                value={form.currency}
                onChange={(value) => setField("currency", value)}
                status={form.currency ? "success" : "default"}
              >
                {currencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </CustomSelect>
            </>
          )}

{step === 4 && (
  <>
    {/* NEW CONTACT STEP UI - Buyer-facing contact (Section 1) */}
    <SectionTitle>{t("requestSale.buyerFacingContact")}</SectionTitle>
    <Badge $variant="public">{t("requestSale.publicBadge")}</Badge>
    <Muted>{t("requestSale.chooseContactDescription")}</Muted>
    
    {isVendorFlow ? (
      // Vendor: Radio cards
      <RadioCardGroup>
        <RadioCard
          $active={form.contact_source === "agency_profile"}
          onClick={() => setField("contact_source", "agency_profile")}
        >
          <RadioIndicator $active={form.contact_source === "agency_profile"} />
          <RadioCardContent>
            <RadioCardHeading>
              <RadioCardTitle>{t("requestSale.agencyProfileContact")}</RadioCardTitle>
              <Badge $variant="recommended">{t("requestSale.recommendedBadge")}</Badge>
            </RadioCardHeading>
            <RadioCardDescription>{t("requestSale.agencyProfileDescription")}</RadioCardDescription>
          </RadioCardContent>
        </RadioCard>
        <RadioCard
          $active={form.contact_source === "custom_contact"}
          onClick={() => setField("contact_source", "custom_contact")}
        >
          <RadioIndicator $active={form.contact_source === "custom_contact"} />
          <RadioCardContent>
            <RadioCardHeading>
              <RadioCardTitle>{t("requestSale.customListingContact")}</RadioCardTitle>
            </RadioCardHeading>
            <RadioCardDescription>{t("requestSale.customListingDescription")}</RadioCardDescription>
          </RadioCardContent>
        </RadioCard>
      </RadioCardGroup>
    ) : (
      // Non-vendor: Direct owner (no radio choice)
      <Muted>{t("requestSale.directOwnerContact")}</Muted>
    )}
    
    {/* Conditional buyer-facing fields */}
    {(form.contact_source === "custom_contact" || !isVendorFlow) && (
      <>
        <CustomInput
          id={`${fieldId}-listing-contact-name`}
          name="listing_contact_name"
          label={t("requestSale.listingContactName")}
          value={form.listing_contact_name}
          onChange={(e) => setField("listing_contact_name", e.target.value)}
          error={stepAttempted[4] ? listingContactNameError : null}
        />
        <CustomInput
          id={`${fieldId}-listing-contact-phone`}
          label={t("requestSale.listingContactPrimaryPhone")}
          type="tel"
          value={form.listing_contact_phone}
          onChange={(e) => setField("listing_contact_phone", e.target.value)}
          error={stepAttempted[4] ? listingContactPhoneError : null}
        />
        <CustomInput
          id={`${fieldId}-listing-contact-phone-secondary`}
          label={t("requestSale.listingContactSecondaryPhone")}
          type="tel"
          value={form.listing_contact_phone_secondary}
          onChange={(e) => setField("listing_contact_phone_secondary", e.target.value)}
        />
      </>
    )}
    
    {/* Section 2: Private owner details (vendor-only, collapsed) */}
    {isVendorFlow && (
      <>
        <CollapsibleSection>
          <CollapsibleTrigger
            type="button"
            $expanded={showPrivateOwner}
            onClick={() => setShowPrivateOwner((current) => !current)}
          >
            <CollapsibleText>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Badge $variant="internal">{t("requestSale.internalBadge")}</Badge>
                <Badge $variant="optional">Optional</Badge>
              </div>
              <strong>{t("requestSale.privateOwnerDetails")}</strong>
              <Muted>{t("requestSale.privateOwnerDescription")}</Muted>
            </CollapsibleText>
            <CollapsibleChevron $expanded={showPrivateOwner} />
          </CollapsibleTrigger>
          {showPrivateOwner && (
            <CollapsibleBody>
              <CustomInput
                id={`${fieldId}-owner-name`}
                label={t("requestSale.ownerName")}
                value={form.owner_name}
                onChange={(e) => setField("owner_name", e.target.value)}
              />
              <CustomInput
                id={`${fieldId}-owner-phone`}
                label={t("requestSale.ownerPhone")}
                type="tel"
                name="owner_phone"
                value={form.owner_phone}
                onChange={(e) => setField("owner_phone", e.target.value)}
              />
              <CustomInput
                id={`${fieldId}-owner-phone-secondary`}
                label={t("requestSale.ownerPhoneSecondary")}
                type="tel"
                name="owner_phone_secondary"
                value={form.owner_phone_secondary}
                onChange={(e) => setField("owner_phone_secondary", e.target.value)}
              />
              <CustomTextarea
                id={`${fieldId}-owner-note`}
                label={t("requestSale.ownerNote")}
                value={form.owner_note}
                onChange={(e) => setField("owner_note", e.target.value)}
              />
            </CollapsibleBody>
          )}
        </CollapsibleSection>
      </>
    )}
  </>
)}

          {error && <ErrorText>{error}</ErrorText>}
          {editLockedMessage && <ErrorText>{editLockedMessage}</ErrorText>}

          <Actions>
            <SecondaryButton
              type="button"
              onClick={() => setStep((prev) => Math.max(0, prev - 1))}
              disabled={step === 0}
            >
              {t("common.back")}
            </SecondaryButton>
            {step < stepKeys.length - 1 ? (
              <PrimaryButton type="button" onClick={handleNext}>
                {t("common.next")}
                <ChevronRight size={16} style={{ marginLeft: 6 }} />
              </PrimaryButton>
            ) : (
              <PrimaryButton type="button" onClick={handleSubmit} disabled={submitting || loadingEdit || customerLimitReached}>
                {loadingEdit
                  ? t("common.loading")
                  : submitting
                    ? t("common.submitting")
                    : isEdit
                      ? t("common.saveChanges")
                      : profileRole === "vendor_user"
                        ? t("listing.submitRequest")
                        : "Publish listing"}
              </PrimaryButton>
            )}
          </Actions>
        </FormCard>
      </PageShell>
      {(submitting || loadingEdit) && (
        <LoadingOverlay
          message={loadingEdit ? t("requestSale.loadingRequest") : t("requestSale.submittingRequest")}
        />
      )}
      {success && (
        <SuccessOverlay>
          <SuccessModal>
            <strong>{isEdit ? t("requestSale.successUpdated") : t("requestSale.successThanks")}</strong>
            <Muted>
              {isEdit
                ? profileRole === "vendor_user"
                  ? t("requestSale.successReviewUpdate")
                  : "Your listing has been updated."
                : profileRole === "vendor_user"
                  ? t("requestSale.successReviewNew")
                  : "Your listing is now live on the marketplace."}
            </Muted>
            <Actions>
              {profileRole === "vendor_user" ? (
                <>
                  <SecondaryButton type="button" onClick={() => router.push("/hub?section=manage-listings")}>
                    Go to manage listings
                  </SecondaryButton>
                  <PrimaryButton type="button" onClick={() => router.push(vendorReturnPath)}>
                    Back to hub
                  </PrimaryButton>
                </>
              ) : (
                <>
                  <SecondaryButton type="button" onClick={() => router.push("/")}>
                    {t("requestSale.browseListings")}
                  </SecondaryButton>
                  <SecondaryButton type="button" onClick={() => router.push("/account")}>
                    {t("requestSale.goActivities")}
                  </SecondaryButton>
                  {successListingId ? (
                    <PrimaryButton type="button" onClick={() => router.push(`/listing/${successListingId}`)}>
                      View listing
                    </PrimaryButton>
                  ) : null}
                </>
              )}
            </Actions>
          </SuccessModal>
        </SuccessOverlay>
      )}
      {mapHelpOpen && (
        <HelpOverlay>
          <HelpModal>
            <strong>We couldn&apos;t place this location automatically.</strong>
            <Muted>
              You can still continue by entering coordinates or placing the pin yourself.
            </Muted>
            <HelpList>
              <li>Use the latitude and longitude fields if you already know the location coordinates.</li>
              <li>Use "View on map and select" to open the map and place the pin manually.</li>
            </HelpList>
            <Actions>
              <SecondaryButton type="button" onClick={() => setMapHelpOpen(false)}>
                I&apos;ll use lat/lng
              </SecondaryButton>
              <PrimaryButton type="button" onClick={handleOpenMapManual}>
                View on map and select
              </PrimaryButton>
            </Actions>
          </HelpModal>
        </HelpOverlay>
      )}
      {latLngOpen && (
        <HelpOverlay>
          <HelpModal>
            <strong>Use latitude and longitude</strong>
            <Muted>Enter decimal coordinates if you already know the exact location.</Muted>
            <HelpList>
              <li>Use decimal format, for example latitude `16.8661` and longitude `96.1951`.</li>
              <li>Latitude should be between `-90` and `90`. Longitude should be between `-180` and `180`.</li>
              <li>This only places the map pin. Your State/Region, District, and Township stay as you selected them.</li>
            </HelpList>
            <CustomInput
              id={`${fieldId}-latitude-modal`}
              label={t("requestSale.latitudeLabel")}
              name="latitude"
              value={form.latitude}
              onChange={(event) => setField("latitude", event.target.value)}
            />
            <CustomInput
              id={`${fieldId}-longitude-modal`}
              label={t("requestSale.longitudeLabel")}
              name="longitude"
              value={form.longitude}
              onChange={(event) => setField("longitude", event.target.value)}
            />
            {mapError ? <ErrorText>{mapError}</ErrorText> : null}
            <Actions>
              <SecondaryButton type="button" onClick={() => setLatLngOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="button" onClick={handleUseLatLng}>
                Apply coordinates
              </PrimaryButton>
            </Actions>
          </HelpModal>
        </HelpOverlay>
      )}
      {limitPopup && (
        <HelpOverlay>
          <LimitModal>
            <strong>Input limit reached</strong>
            <Muted>{limitPopup}</Muted>
            <HelpList>
              <li>Title can use up to {REQUEST_TITLE_MAX_WORDS} words.</li>
              <li>Description can use up to {REQUEST_DESCRIPTION_MAX_LENGTH} characters.</li>
            </HelpList>
            <Actions>
              <PrimaryButton type="button" onClick={() => setLimitPopup(null)}>
                OK
              </PrimaryButton>
            </Actions>
          </LimitModal>
        </HelpOverlay>
      )}
      {moderationPopup && (
        <HelpOverlay>
          <LimitModal>
            <strong>Update your title or description</strong>
            <Muted>{moderationPopup}</Muted>
            <HelpList>
              <li>Remove profanity or abusive wording.</li>
              <li>Do not include drug-sale or illegal service language.</li>
              <li>Do not add spammy contact-promotion text.</li>
            </HelpList>
            <Actions>
              <PrimaryButton
                type="button"
                onClick={() => {
                  setModerationPopup(null);
                  setStep(0);
                }}
              >
                Back to basics
              </PrimaryButton>
            </Actions>
          </LimitModal>
        </HelpOverlay>
      )}
    </div>
  );
}

export default function RequestSalePage() {
  return (
    <Suspense fallback={<LoadingOverlay message="Loading..." />}>
      <RequestSalePageContent />
    </Suspense>
  );
}
