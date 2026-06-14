"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { ArrowUpRight, Pencil, MapPinned, Images, CalendarClock } from "lucide-react";
import { useAppState } from "@/features/site/shared/lib/app-state";
import { formatCurrency } from "@/features/site/shared/lib/format";
import { useI18n } from "@/features/site/shared/lib/i18n";
import { LoadingOverlay } from "@/features/site/shared/components/LoadingOverlay";

const Page = styled.div`
  display: grid;
  gap: 20px;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const Heading = styled.div`
  display: grid;
  gap: 8px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  color: #f8fafc;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #98a2b3;
  line-height: 1.6;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const PrimaryAction = styled(Link)`
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #ff3d5d 0%, #e91b42 100%);
  color: white;
  font-weight: 700;
`;

const SecondaryAction = styled(Link)`
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f8fafc;
  background: transparent;
  font-weight: 700;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 16px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #151b29;
  padding: 18px;
  display: grid;
  gap: 14px;
`;

const Cover = styled.div`
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  aspect-ratio: 16 / 9;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Thumb = styled.div`
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  aspect-ratio: 4 / 3;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
`;

const Label = styled.span`
  color: #98a2b3;
`;

const Value = styled.span`
  color: #f8fafc;
  font-weight: 600;
  text-align: right;
`;

const Chips = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Chip = styled.span`
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #d8deea;
  font-size: 0.82rem;
  font-weight: 600;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  color: #f3f4f6;
`;

const Copy = styled.p`
  margin: 0;
  color: #b7c0d0;
  line-height: 1.65;
`;

const Empty = styled.div`
  border-radius: 24px;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.02);
  padding: 24px;
  color: #97a0b2;
  line-height: 1.65;
`;

type PropertyDetail = {
  id: string;
  title: string | null;
  description: string | null;
  deal_type: string | null;
  property_type: string | null;
  status: string | null;
  price: number | null;
  currency: string | null;
  state_region: string | null;
  district: string | null;
  township: string | null;
  city: string | null;
  address_text: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  has_lift: boolean | null;
  has_backup_power: boolean | null;
  backup_power_type: string | null;
  has_parking: boolean | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string | null;
  updated_at: string | null;
  cover_image_url?: string | null;
};

type PropertyImage = {
  id: string;
  resolved_url: string | null;
};

function labelize(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function VendorPropertyDetailView({ propertyId }: { propertyId: string }) {
  const { authToken } = useAppState();
  const { t, language } = useI18n();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/vendor/properties/${propertyId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const payload = (await response.json()) as {
          property?: PropertyDetail;
          images?: PropertyImage[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load property.");
        }
        if (!cancelled) {
          setProperty(payload.property ?? null);
          setImages(payload.images ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load property.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [authToken, propertyId]);

  if (loading) {
    return <LoadingOverlay message="Loading property..." />;
  }

  if (error || !property) {
    return <Empty>{error ?? "Property not found."}</Empty>;
  }

  const location = [property.township, property.district, property.state_region].filter(Boolean).join(" / ");
  const imageRows = images.filter((image) => image.resolved_url);
  const featureChips = [
    property.has_lift ? "Lift" : null,
    property.has_parking ? "Parking" : null,
    property.has_backup_power ? `Backup: ${labelize(property.backup_power_type)}` : null,
    property.area_sqft ? `${property.area_sqft} sqft` : null,
    property.bedrooms ? `${property.bedrooms} beds` : null,
    property.bathrooms ? `${property.bathrooms} baths` : null,
  ].filter(Boolean) as string[];

  return (
    <Page>
      <Header>
        <Heading>
          <Title>{property.title || "Untitled property"}</Title>
          <Subtitle>
            Vendor workspace detail view for this live property record.
          </Subtitle>
        </Heading>

        <HeaderActions>
          <PrimaryAction href={`/vendor/properties/${propertyId}/edit`}>
            <Pencil size={16} />
            <span>Edit property</span>
          </PrimaryAction>
          <SecondaryAction href={`/listing/${propertyId}`}>
            <ArrowUpRight size={16} />
            <span>Open public listing</span>
          </SecondaryAction>
        </HeaderActions>
      </Header>

      <Grid>
        <Card>
          {property.cover_image_url ? (
            <Cover>
              <img src={property.cover_image_url} alt={property.title || "Property cover"} />
            </Cover>
          ) : null}

          <Chips>
            <Chip>{labelize(property.status)}</Chip>
            <Chip>{labelize(property.deal_type)}</Chip>
            <Chip>{labelize(property.property_type)}</Chip>
          </Chips>

          <Row>
            <Label>Price</Label>
            <Value>{formatCurrency(property.price ?? undefined, property.currency ?? "MMK", "Contact", language)}</Value>
          </Row>
          <Row>
            <Label>Location</Label>
            <Value>{location || "Unspecified"}</Value>
          </Row>
          <Row>
            <Label>Address</Label>
            <Value>{property.address_text || "Not specified"}</Value>
          </Row>
          <Row>
            <Label>Created</Label>
            <Value>{formatDate(property.created_at)}</Value>
          </Row>
          <Row>
            <Label>Updated</Label>
            <Value>{formatDate(property.updated_at)}</Value>
          </Row>

          {property.description ? (
            <>
              <SectionTitle>Description</SectionTitle>
              <Copy>{property.description}</Copy>
            </>
          ) : null}
        </Card>

        <Card>
          <SectionTitle>Property profile</SectionTitle>
          <Row>
            <Label>State / Region</Label>
            <Value>{property.state_region || "Unknown"}</Value>
          </Row>
          <Row>
            <Label>District</Label>
            <Value>{property.district || "Unknown"}</Value>
          </Row>
          <Row>
            <Label>Township</Label>
            <Value>{property.township || "Unknown"}</Value>
          </Row>
          <Row>
            <Label>Coordinates</Label>
            <Value>
              {property.latitude !== null && property.longitude !== null
                ? `${property.latitude}, ${property.longitude}`
                : "Not pinned"}
            </Value>
          </Row>

          {featureChips.length ? (
            <>
              <SectionTitle>Features</SectionTitle>
              <Chips>
                {featureChips.map((chip) => (
                  <Chip key={chip}>{chip}</Chip>
                ))}
              </Chips>
            </>
          ) : null}
        </Card>
      </Grid>

      <Card>
        <SectionTitle>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Images size={16} color="#ff7f96" />
            Property images
          </span>
        </SectionTitle>
        {imageRows.length ? (
          <ImageGrid>
            {imageRows.map((image) => (
              <Thumb key={image.id}>
                <img src={image.resolved_url!} alt="Property" />
              </Thumb>
            ))}
          </ImageGrid>
        ) : (
          <Copy>No uploaded property images were found for this listing.</Copy>
        )}
      </Card>

      <Card>
        <SectionTitle>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <CalendarClock size={16} color="#ff7f96" />
            Workspace actions
          </span>
        </SectionTitle>
        <Copy>
          Use the edit flow to update pricing, status, location, and feature details directly from the vendor workspace.
        </Copy>
        <HeaderActions>
          <PrimaryAction href={`/vendor/properties/${propertyId}/edit`}>
            <Pencil size={16} />
            <span>Edit from workspace</span>
          </PrimaryAction>
        </HeaderActions>
      </Card>
    </Page>
  );
}
