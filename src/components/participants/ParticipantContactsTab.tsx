import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";

const CONTACT_TYPES = Constants.public.Enums.contact_type;

export function ParticipantContactsTab({ participantId, canEdit }: { participantId: string; canEdit: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactType, setContactType] = useState<string>("other");
  const [isPrimary, setIsPrimary] = useState(false);

  const { data: contacts = [] } = useQuery({
    queryKey: ["participant-contacts", participantId],
    queryFn: async () => {
      const { data } = await supabase.from("participant_contacts").select("*").eq("participant_id", participantId).order("is_primary", { ascending: false });
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("participant_contacts").insert({
        participant_id: participantId,
        name: name.trim(),
        relationship: relationship.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        contact_type: contactType as any,
        is_primary: isPrimary,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participant-contacts", participantId] });
      toast({ title: "Contact added" });
      setShowAdd(false);
      setName(""); setRelationship(""); setPhone(""); setEmail(""); setContactType("other"); setIsPrimary(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Contacts</h3>
          {canEdit && <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="mr-1 h-4 w-4" />Add Contact</Button>}
        </div>
        {contacts.length === 0 ? <p className="text-muted-foreground text-sm">No contacts recorded.</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Relationship</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead>Primary</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><Badge variant="outline">{c.contact_type}</Badge></TableCell>
                  <TableCell>{c.relationship || "—"}</TableCell>
                  <TableCell>{c.phone || "—"}</TableCell>
                  <TableCell>{c.email || "—"}</TableCell>
                  <TableCell>{c.is_primary ? "✓" : ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div>
                <Label>Contact Type</Label>
                <Select value={contactType} onValueChange={setContactType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTACT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Relationship</Label><Input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. Mother, Guardian" /></div>
              <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={isPrimary} onCheckedChange={(v) => setIsPrimary(!!v)} />Primary contact</label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>{mutation.isPending ? "Saving..." : "Add"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
