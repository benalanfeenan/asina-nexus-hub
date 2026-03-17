import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/PageHeader";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  role?: string;
}

export default function Settings() {
  const { role } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  // User management state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("support_worker");
  const [creating, setCreating] = useState(false);

  // Org settings state
  const [orgName, setOrgName] = useState("");
  const [orgAbn, setOrgAbn] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [bankBsb, setBankBsb] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [orgSaving, setOrgSaving] = useState(false);

  // Public holidays state
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayState, setHolidayState] = useState("VIC");
  const [deleteHolidayId, setDeleteHolidayId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email, is_active");
    if (profiles) {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) ?? []);
      setUsers(profiles.map((p) => ({ ...p, full_name: p.full_name ?? "", email: p.email ?? "", role: roleMap.get(p.id) })));
    }
    setLoading(false);
  };

  // Load org settings
  const { data: orgData } = useQuery({
    queryKey: ["organisation-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("organisation_settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (orgData) {
      setOrgName(orgData.name || "");
      setOrgAbn(orgData.abn || "");
      setOrgAddress(orgData.address || "");
      setOrgPhone(orgData.phone || "");
      setOrgEmail(orgData.email || "");
      setOrgLogo(orgData.logo_url || "");
      const bank = (orgData.bank_details || {}) as Record<string, string>;
      setBankBsb(bank.bsb || "");
      setBankAccountName(bank.account_name || "");
      setBankAccountNumber(bank.account_number || "");
    }
  }, [orgData]);

  const { data: holidays = [] } = useQuery({
    queryKey: ["public-holidays"],
    queryFn: async () => {
      const { data } = await supabase.from("public_holidays").select("*").order("date");
      return data || [];
    },
  });

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const { error } = await supabase.functions.invoke("create-user", { body: { email: newEmail, full_name: newName, role: newRole } });
    setCreating(false);
    if (error) {
      toast({ title: "Error creating user", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User created", description: `Invite sent to ${newEmail}` });
      setNewEmail(""); setNewName(""); setNewRole("support_worker");
      fetchUsers();
    }
  };

  const handleSaveOrg = async () => {
    setOrgSaving(true);
    const payload = {
      name: orgName, abn: orgAbn || null, address: orgAddress || null, phone: orgPhone || null, email: orgEmail || null, logo_url: orgLogo || null,
      bank_details: { bsb: bankBsb, account_name: bankAccountName, account_number: bankAccountNumber },
    };
    if (orgData?.id) {
      const { error } = await supabase.from("organisation_settings").update(payload).eq("id", orgData.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Settings saved" }); qc.invalidateQueries({ queryKey: ["organisation-settings"] }); }
    } else {
      const { error } = await supabase.from("organisation_settings").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Settings saved" }); qc.invalidateQueries({ queryKey: ["organisation-settings"] }); }
    }
    setOrgSaving(false);
  };

  const addHolidayMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("public_holidays").insert({ name: holidayName, date: holidayDate, state: holidayState || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["public-holidays"] }); toast({ title: "Holiday added" }); setHolidayName(""); setHolidayDate(""); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("public_holidays").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["public-holidays"] }); toast({ title: "Holiday deleted" }); setDeleteHolidayId(null); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (role !== "admin") {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground">You don't have permission to access settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-bold">Settings</h1>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="organisation">Organisation</TabsTrigger>
          <TabsTrigger value="holidays">Public Holidays</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Create New User</CardTitle><CardDescription>Send an invite to a new staff member</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="space-y-2 flex-1"><Label htmlFor="new-name">Full Name</Label><Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Jane Smith" /></div>
                <div className="space-y-2 flex-1"><Label htmlFor="new-email">Email</Label><Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="jane@example.com" /></div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="house_manager">House Manager</SelectItem>
                      <SelectItem value="support_worker">Support Worker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={creating}>{creating ? "Creating…" : "Create User"}</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Users</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{u.role?.replace("_", " ") ?? "No role"}</Badge></TableCell>
                      <TableCell><Badge variant={u.is_active ? "default" : "destructive"}>{u.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organisation">
          <Card>
            <CardHeader><CardTitle>Organisation Settings</CardTitle><CardDescription>Manage your organisation details</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Organisation Name *</Label><Input value={orgName} onChange={(e) => setOrgName(e.target.value)} /></div>
                <div><Label>ABN</Label><Input value={orgAbn} onChange={(e) => setOrgAbn(e.target.value)} placeholder="XX XXX XXX XXX" /></div>
              </div>
              <div><Label>Address</Label><Input value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Phone</Label><Input value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} /></div>
                <div><Label>Email</Label><Input type="email" value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} /></div>
              </div>
              <div><Label>Logo URL</Label><Input value={orgLogo} onChange={(e) => setOrgLogo(e.target.value)} placeholder="https://..." /></div>

              <h4 className="font-medium pt-2">Bank Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><Label>BSB</Label><Input value={bankBsb} onChange={(e) => setBankBsb(e.target.value)} placeholder="XXX-XXX" /></div>
                <div><Label>Account Name</Label><Input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} /></div>
                <div><Label>Account Number</Label><Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} /></div>
              </div>

              <Button onClick={handleSaveOrg} disabled={!orgName.trim() || orgSaving}>{orgSaving ? "Saving…" : "Save Settings"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Add Public Holiday</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1"><Label>Name *</Label><Input value={holidayName} onChange={(e) => setHolidayName(e.target.value)} placeholder="e.g. Christmas Day" /></div>
                <div><Label>Date *</Label><Input type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} /></div>
                <div><Label>State</Label><Input value={holidayState} onChange={(e) => setHolidayState(e.target.value)} className="w-[100px]" /></div>
                <Button onClick={() => addHolidayMutation.mutate()} disabled={!holidayName || !holidayDate || addHolidayMutation.isPending}>
                  <Plus className="mr-1 h-4 w-4" />Add
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Date</TableHead><TableHead>State</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {holidays.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No public holidays</TableCell></TableRow>
                  ) : holidays.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.name}</TableCell>
                      <TableCell>{h.date}</TableCell>
                      <TableCell>{h.state || "—"}</TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => setDeleteHolidayId(h.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <ConfirmDialog open={!!deleteHolidayId} onOpenChange={() => setDeleteHolidayId(null)} title="Delete Holiday" description="Are you sure?" onConfirm={() => deleteHolidayId && deleteHolidayMutation.mutate(deleteHolidayId)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
