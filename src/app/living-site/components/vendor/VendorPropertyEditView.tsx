"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { normalizeSelectablePropertyType, propertyTypeDefinitions } from "@/lib/property-types";
import { ArrowLeft, Save } from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { getDistricts, getStates, getTownships } from "@/app/living-site/lib/myanmar-geo";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";

const Page = styled.div`
  display: grid;
  gap: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
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

const Card = styled.div`
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #151b29;
  padding: 18px;
  display: grid;
  gap: 14px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Input = styled.input`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #101522;
  color: #f8fafc;
  padding: 0 14px;
  width: 100%;
`;

const Select = styled.select`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #101522;
  color: #f8fafc;
  padding: 0 14px;
  width: 100%;
`;

const Textarea = styled.textarea`
  min-height: 120px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #101522;
  color: #f8fafc;
  padding: 12px 14px;
  width: 100%;
  resize: vertical;
`;

const Label = styled.label`
  display: grid;
  gap: 8px;
  color: #dbe2ef;
  font-weight: 600;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Button = styled.button<{ $primary?: boolean }>`
  min-height: 46px;
  padding: 0 16px;
  border-radius: 999px;
  border: ${(props) => (props.$primary ? "none" : "1px solid rgba(255, 255, 255, 0.12)")};
  background: ${(props) =>
    props.$primary ? "linear-gradient(135deg, #ff3d5d 0%, #e91b42 100%)" : "transparent"};
  color: #fff;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const ToggleRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Toggle = styled.button<{ $active?: boolean }>`
  min-height: 42px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid ${(props) => (props.$active ? "rgba(255, 61, 93, 0.42)" : "rgba(255, 255, 255, 0.12)")};
  background: ${(props) => (props.$active ? "rgba(255, 61, 93, 0.12)" : "transparent")};
  color: ${(props) => (props.$active ? "#ffdbe2" : "#e7edf8")};
  font-weight: 700;
  cursor: pointer;
`;

const ErrorText = styled.div`
  color: #ff97a8;
  line-height: 1.55;
`;

type PropertyForm = {
  title: string;
  description: string;
  deal_type: string;
  property_type: string;
  status: string;
  price: string;
  currency: string;
  state_region: string;
  district: string;
  township: string;
  city: string;
  address_text: string;
  bedrooms: string;
  bathrooms: string;
  area_sqft: string;
  has_lift: boolean;
  has_backup_power: boolean;
  backup_power_type: string;
  has_parking: boolean;
  latitude: string;
  longitude: string;
};

const initialForm: PropertyForm = {
  title: "",
  description: "",
  deal_type: "sale",
  property_type: "house",
  status: "draft",
  price: "",
  currency: "MMK",
  state_region: "",
  district: "",
  township: "",
  city: "",
  address_text: "",
  bedrooms: "",
  bathrooms: "",
  area_sqft: "",
  has_lift: false,
  has_backup_power: false,
  backup_power_type: "",
  has_parking: false,
  latitude: "",
  longitude: "",
};

function toFormNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function toNullableNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function VendorPropertyEditView({ propertyId }: { propertyId: string }) {
  const { authToken } = useAppState();
  const router = useRouter();
  const [form, setForm] = useState<PropertyForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const states = useMemo(() => getStates(), []);
  const districts = useMemo(() => getDistricts(form.state_region), [form.state_region]);
  const townships = useMemo(() => getTownships(form.state_region, form.district), [form.state_region, form.district]);
  const isLand = form.property_type === "land";

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
        const payload = (await response.json()) as { property?: Record<string, unknown>; error?: string };
        if (!response.ok || !payload.property) {
          throw new Error(payload?.error || "Unable to load property.");
        }
        if (!cancelled) {
          const property = payload.property;
          setForm({
            title: String(property.title ?? ""),
            description: String(property.description ?? ""),
            deal_type: String(property.deal_type ?? "sale"),
            property_type: normalizeSelectablePropertyType(String(property.property_type ?? "house")),
            status: String(property.status ?? "draft"),
            price: toFormNumber(property.price),
            currency: String(property.currency ?? "MMK"),
            state_region: String(property.state_region ?? ""),
            district: String(property.district ?? ""),
            township: String(property.township ?? ""),
            city: String(property.city ?? ""),
            address_text: String(property.address_text ?? ""),
            bedrooms: toFormNumber(property.bedrooms),
            bathrooms: toFormNumber(property.bathrooms),
            area_sqft: toFormNumber(property.area_sqft),
            has_lift: Boolean(property.has_lift),
            has_backup_power: Boolean(property.has_backup_power),
            backup_power_type: String(property.backup_power_type ?? ""),
            has_parking: Boolean(property.has_parking),
            latitude: toFormNumber(property.latitude),
            longitude: toFormNumber(property.longitude),
          });
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

  const setField = (key: keyof PropertyForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!authToken) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/vendor/properties/${propertyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...form,
          bedrooms: isLand ? null : toNullableNumber(form.bedrooms),
          bathrooms: isLand ? null : toNullableNumber(form.bathrooms),
          area_sqft: toNullableNumber(form.area_sqft),
          price: toNullableNumber(form.price),
          latitude: toNullableNumber(form.latitude),
          longitude: toNullableNumber(form.longitude),
          has_lift: isLand ? false : form.has_lift,
          has_backup_power: isLand ? false : form.has_backup_power,
          backup_power_type: isLand || !form.has_backup_power ? null : form.backup_power_type || null,
          has_parking: isLand ? false : form.has_parking,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save property.");
      }

      router.push(`/vendor/properties/${propertyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save property.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading property editor..." />;
  }

  return (
    <Page>
      <Header>
        <Heading>
          <Title>Edit property</Title>
          <Subtitle>Update the live property record directly inside the vendor workspace.</Subtitle>
        </Heading>
        <Actions>
          <Button type="button" onClick={() => router.push(`/vendor/properties/${propertyId}`)}>
            <ArrowLeft size={16} />
            <span>Back to detail</span>
          </Button>
          <Button type="button" $primary onClick={handleSubmit} disabled={saving}>
            <Save size={16} />
            <span>{saving ? "Saving..." : "Save changes"}</span>
          </Button>
        </Actions>
      </Header>

      {error ? <ErrorText>{error}</ErrorText> : null}

      <Card>
        <Grid>
          <Label>
            Title
            <Input value={form.title} onChange={(event) => setField("title", event.target.value)} />
          </Label>
          <Label>
            Status
            <Select value={form.status} onChange={(event) => setField("status", event.target.value)}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
              <option value="expired">Expired</option>
              <option value="archived">Archived</option>
              <option value="rejected">Rejected</option>
            </Select>
          </Label>
          <Label>
            Deal type
            <Select value={form.deal_type} onChange={(event) => setField("deal_type", event.target.value)}>
              <option value="sale">Sale</option>
              <option value="rent">Rent</option>
            </Select>
          </Label>
          <Label>
            Property type
            <Select value={form.property_type} onChange={(event) => setField("property_type", event.target.value)}>
              {propertyTypeDefinitions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Label>
          <Label style={{ gridColumn: "1 / -1" }}>
            Description
            <Textarea value={form.description} onChange={(event) => setField("description", event.target.value)} />
          </Label>
        </Grid>
      </Card>

      <Card>
        <Grid>
          <Label>
            Price
            <Input value={form.price} onChange={(event) => setField("price", event.target.value)} />
          </Label>
          <Label>
            Currency
            <Select value={form.currency} onChange={(event) => setField("currency", event.target.value)}>
              <option value="MMK">MMK</option>
              <option value="USD">USD</option>
              <option value="CNY">CNY</option>
              <option value="THB">THB</option>
            </Select>
          </Label>
          <Label>
            State / Region
            <Select
              value={form.state_region}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  state_region: event.target.value,
                  district: "",
                  township: "",
                }))
              }
            >
              <option value="">Select state</option>
              {states.map((state) => (
                <option key={state.pcode} value={state.name_en}>
                  {state.name_en}
                </option>
              ))}
            </Select>
          </Label>
          <Label>
            District
            <Select
              value={form.district}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  district: event.target.value,
                  township: "",
                }))
              }
            >
              <option value="">Select district</option>
              {districts.map((district) => (
                <option key={district.pcode} value={district.name_en}>
                  {district.name_en}
                </option>
              ))}
            </Select>
          </Label>
          <Label>
            Township
            <Select value={form.township} onChange={(event) => setField("township", event.target.value)}>
              <option value="">Select township</option>
              {townships.map((township) => (
                <option key={township.pcode} value={township.name_en}>
                  {township.name_en}
                </option>
              ))}
            </Select>
          </Label>
          <Label>
            City
            <Input value={form.city} onChange={(event) => setField("city", event.target.value)} />
          </Label>
          <Label style={{ gridColumn: "1 / -1" }}>
            Address text
            <Textarea value={form.address_text} onChange={(event) => setField("address_text", event.target.value)} />
          </Label>
        </Grid>
      </Card>

      <Card>
        <Grid>
          <Label>
            Area (sqft)
            <Input value={form.area_sqft} onChange={(event) => setField("area_sqft", event.target.value)} />
          </Label>
          <Label>
            Latitude
            <Input value={form.latitude} onChange={(event) => setField("latitude", event.target.value)} />
          </Label>
          <Label>
            Longitude
            <Input value={form.longitude} onChange={(event) => setField("longitude", event.target.value)} />
          </Label>
          {!isLand ? (
            <>
              <Label>
                Bedrooms
                <Input value={form.bedrooms} onChange={(event) => setField("bedrooms", event.target.value)} />
              </Label>
              <Label>
                Bathrooms
                <Input value={form.bathrooms} onChange={(event) => setField("bathrooms", event.target.value)} />
              </Label>
              <div />
            </>
          ) : null}
        </Grid>

        {!isLand ? (
          <>
            <Label>Features</Label>
            <ToggleRow>
              <Toggle type="button" $active={form.has_lift} onClick={() => setField("has_lift", !form.has_lift)}>
                Lift
              </Toggle>
              <Toggle type="button" $active={form.has_parking} onClick={() => setField("has_parking", !form.has_parking)}>
                Parking
              </Toggle>
              <Toggle
                type="button"
                $active={form.has_backup_power}
                onClick={() => {
                  const next = !form.has_backup_power;
                  setField("has_backup_power", next);
                  if (!next) {
                    setField("backup_power_type", "");
                  }
                }}
              >
                Backup power
              </Toggle>
            </ToggleRow>

            {form.has_backup_power ? (
              <Label>
                Backup power type
                <Select value={form.backup_power_type} onChange={(event) => setField("backup_power_type", event.target.value)}>
                  <option value="">Select type</option>
                  <option value="solar">Solar</option>
                  <option value="generator">Generator</option>
                  <option value="solar_generator">Solar + Generator</option>
                </Select>
              </Label>
            ) : null}
          </>
        ) : null}
      </Card>
    </Page>
  );
}
