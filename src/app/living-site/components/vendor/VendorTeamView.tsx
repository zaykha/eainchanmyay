"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { ShieldPlus, UserPlus } from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";

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
  gap: 6px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  color: #f8fafc;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #98a2b3;
  line-height: 1.55;
  max-width: 760px;
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
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 12px;
`;

const Input = styled.input`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #101522;
  color: #f8fafc;
  padding: 0 14px;
`;

const Select = styled.select`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #101522;
  color: #f8fafc;
  padding: 0 14px;
`;

const Button = styled.button`
  min-height: 46px;
  width: fit-content;
  padding: 0 16px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #ff3d5d 0%, #e91b42 100%);
  color: white;
  font-weight: 700;
  cursor: pointer;
`;

const SecondaryButton = styled.button`
  min-height: 42px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: #f8fafc;
  font-weight: 700;
  cursor: pointer;
`;

const Empty = styled.div`
  color: #98a2b3;
  line-height: 1.65;
`;

const MembersList = styled.div`
  display: grid;
  gap: 12px;
`;

const MemberCard = styled.div`
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #101522;
  padding: 14px;
  display: grid;
  gap: 10px;
`;

const MemberTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const Name = styled.div`
  color: #f8fafc;
  font-weight: 700;
`;

const Meta = styled.div`
  color: #96a0b3;
  font-size: 0.9rem;
`;

const Pill = styled.span`
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: #e1e7f3;
  display: inline-flex;
  align-items: center;
  font-size: 0.82rem;
  font-weight: 700;
`;

const MemberActions = styled.form`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
`;

const Message = styled.p`
  margin: 0;
  color: #ff97a8;
  line-height: 1.55;
`;

const Notice = styled.div<{ $danger?: boolean }>`
  border-radius: 20px;
  border: 1px solid ${(props) => (props.$danger ? "rgba(255, 148, 148, 0.22)" : "rgba(255, 210, 92, 0.22)")};
  background: ${(props) => (props.$danger ? "rgba(255, 148, 148, 0.08)" : "rgba(255, 210, 92, 0.08)")};
  padding: 16px 18px;
  color: ${(props) => (props.$danger ? "#ffd9df" : "#f2dfab")};
  line-height: 1.6;
`;

type Member = {
  user_id: string;
  role: string;
  status: string;
  created_at: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type WorkspaceLimits = {
  membership?: {
    role?: string | null;
  };
  limits?: {
    currentPlan?: {
      name: string;
    };
    agentCount?: number;
    agentLimit?: number;
    agentNearLimit?: boolean;
    agentOverLimit?: boolean;
    suggestedUpgrade?: {
      name: string;
      priceLabel: string;
    } | null;
  };
  error?: string;
};

function labelize(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function VendorTeamView() {
  const { authToken } = useAppState();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [workspaceLimits, setWorkspaceLimits] = useState<WorkspaceLimits["limits"] | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  const [savingInvite, setSavingInvite] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const activeCount = useMemo(
    () => members.filter((member) => member.status === "active").length,
    [members]
  );

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [teamResponse, workspaceResponse] = await Promise.all([
          fetch("/api/vendor/team", {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }),
          fetch("/api/vendor/workspace", {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }),
        ]);
        const payload = (await teamResponse.json()) as { members?: Member[]; error?: string };
        const workspacePayload = (await workspaceResponse.json()) as WorkspaceLimits;
        if (!teamResponse.ok) {
          throw new Error(payload?.error || "Unable to load the vendor team.");
        }
        if (!workspaceResponse.ok) {
          throw new Error(workspacePayload?.error || "Unable to load vendor workspace permissions.");
        }
        if (!cancelled) {
          setMembers(payload.members ?? []);
          setCanManage(["owner", "admin"].includes(String(workspacePayload.membership?.role ?? "")));
          setWorkspaceLimits(workspacePayload.limits ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load the vendor team.");
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
  }, [authToken]);

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!authToken) return;
    setSavingInvite(true);
    setError(null);
    try {
      const response = await fetch("/api/vendor/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });
      const payload = (await response.json()) as { member?: Member; error?: string };
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to add vendor member.");
      }
      const newMember = payload.member;
      if (newMember) {
        setMembers((prev) => [...prev, newMember]);
      }
      setInviteEmail("");
      setInviteRole("agent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add vendor member.");
    } finally {
      setSavingInvite(false);
    }
  };

  const handleMemberUpdate = async (member: Member, nextRole: string, nextStatus: string) => {
    if (!authToken) return;
    setSavingUserId(member.user_id);
    setError(null);
    try {
      const response = await fetch("/api/vendor/team", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          user_id: member.user_id,
          role: nextRole,
          status: nextStatus,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update the team member.");
      }
      setMembers((prev) =>
        prev.map((item) =>
          item.user_id === member.user_id
            ? {
                ...item,
                role: nextRole,
                status: nextStatus,
              }
            : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update the team member.");
    } finally {
      setSavingUserId(null);
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading team..." />;
  }

  return (
    <Page>
      <Header>
        <Heading>
          <Title>Team</Title>
          <Subtitle>
            Manage vendor workspace seats under this company. Phase 2 adds plan-aware seat visibility while the billing and hard enforcement layer is still being built.
          </Subtitle>
        </Heading>
      </Header>

      {error ? <Message>{error}</Message> : null}

      {workspaceLimits && workspaceLimits.agentNearLimit ? (
        <Notice $danger={workspaceLimits.agentOverLimit}>
          {workspaceLimits.agentOverLimit
            ? "This workspace is above its current seat soft limit. New billing enforcement should force an upgrade or seat reduction in a later phase."
            : `This workspace is close to its seat limit: ${workspaceLimits.agentCount ?? activeCount}/${workspaceLimits.agentLimit ?? activeCount}. ${
                workspaceLimits.suggestedUpgrade
                  ? `Recommended upgrade: ${workspaceLimits.suggestedUpgrade.name} (${workspaceLimits.suggestedUpgrade.priceLabel}).`
                  : ""
              }`}
        </Notice>
      ) : null}

      <Grid>
        <Card>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#f8fafc", fontWeight: 700 }}>
            <UserPlus size={18} color="#ff5d78" />
            <span>Add team member</span>
          </div>
          {canManage ? (
            <>
              <Empty>
                This currently adds existing vendor accounts by email into this workspace. Invitation emails and pending seats come in a later phase.
              </Empty>
              <Form onSubmit={handleInvite}>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="member@example.com"
                  required
                />
                <Select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </Select>
                <Button type="submit" disabled={savingInvite}>
                  {savingInvite ? "Adding..." : "Add member"}
                </Button>
              </Form>
            </>
          ) : (
            <Empty>Only owner and admin seats can add or manage team members in this workspace.</Empty>
          )}
        </Card>

        <Card>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#f8fafc", fontWeight: 700 }}>
            <ShieldPlus size={18} color="#ff5d78" />
            <span>Workspace summary</span>
          </div>
          <Empty>{activeCount} active seats across this vendor workspace.</Empty>
          <Empty>
            Roles:
            <br />
            Owner: full vendor control
            <br />
            Admin: operational and team management
            <br />
            Agent: day-to-day workspace access and field operations
          </Empty>
        </Card>
      </Grid>

      <Card>
        <Title as="h2" style={{ fontSize: "1.2rem" }}>
          Current members
        </Title>
        {!members.length ? (
          <Empty>No team members found for this workspace yet.</Empty>
        ) : (
          <MembersList>
            {members.map((member) => (
              <MemberCard key={member.user_id}>
                <MemberTop>
                  <div>
                    <Name>{member.full_name || member.email || "Unnamed member"}</Name>
                    <Meta>{member.email || "No email"}</Meta>
                    {member.phone ? <Meta>{member.phone}</Meta> : null}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Pill>{labelize(member.role)}</Pill>
                    <Pill>{labelize(member.status)}</Pill>
                  </div>
                </MemberTop>
                {canManage ? (
                  <MemberActions
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      handleMemberUpdate(
                        member,
                        String(formData.get("role") || member.role),
                        String(formData.get("status") || member.status)
                      );
                    }}
                    >
                      <Select name="role" defaultValue={member.role}>
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </Select>
                    <Select name="status" defaultValue={member.status}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Select>
                    <SecondaryButton type="submit" disabled={savingUserId === member.user_id}>
                      {savingUserId === member.user_id ? "Saving..." : "Save"}
                    </SecondaryButton>
                  </MemberActions>
                ) : null}
              </MemberCard>
            ))}
          </MembersList>
        )}
      </Card>
    </Page>
  );
}
