"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ShieldCheck,
  UserPlus,
  Trash2,
  KeyRound,
  Shield,
  Info,
} from "lucide-react";
import {
  getAllAdmins,
  createOrUpdateAdmin,
  deleteAdmin,
  getRoles,
  AdminRecord,
  RoleRecord,
} from "@/lib/supabase/services";
import { useFirebase } from "@/firebase";

export default function AdminsPage() {
  const { user } = useFirebase();
  const { toast } = useToast();

  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for adding admin
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");

  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      const data = await getAllAdmins();
      setAdmins(data);
    } catch (err: any) {
      console.error("Error fetching admins:", err);
      toast({
        variant: "destructive",
        title: "Error Loading Admins",
        description: err.message || "Could not retrieve admins from the database.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
    getRoles()
      .then(roles => {
        // Filter roles applicable to administrators
        const adminRoles = roles.filter(r => r.name !== 'customer');
        setAvailableRoles(adminRoles.length > 0 ? adminRoles : roles);
      })
      .catch(() => {});
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Email and password are required for admin access.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedRoleObj = availableRoles.find(r => r.name === role);
      await createOrUpdateAdmin({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim() || undefined,
        role,
        role_id: selectedRoleObj?.id || (role === 'superadmin' ? 3 : 1),
      });

      toast({
        title: "Admin Created",
        description: `Admin ${email} has been saved to the admins table.`,
      });

      setIsDialogOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("admin");
      await loadAdmins();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to Add Admin",
        description: err.message || "An error occurred while creating the admin.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminEmail: string) => {
    if (user?.email?.toLowerCase() === adminEmail.toLowerCase()) {
      toast({
        variant: "destructive",
        title: "Action Prohibited",
        description: "You cannot delete your own admin account.",
      });
      return;
    }

    if (!confirm(`Are you sure you want to remove ${adminEmail} from administrators?`)) {
      return;
    }

    try {
      await deleteAdmin(adminId);
      toast({
        title: "Admin Removed",
        description: `Admin ${adminEmail} has been deleted.`,
      });
      await loadAdmins();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err.message || "Could not delete the admin record.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" /> Admin Users
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage system administrator credentials stored in the dedicated Supabase <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">admins</code> table.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Add New Admin
        </Button>
      </div>

     

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Administrators</CardTitle>
          <CardDescription>
            All users with authorization to access the Polaris Tax Admin Console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Administrator</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No administrators found in the database. Click "Add New Admin" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((adm) => (
                    <TableRow key={adm.id || adm.email}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        {adm.name || "Administrator"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{adm.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant={adm.role === "superadmin" || adm.role_id === 3 ? "default" : "secondary"}>
                            {adm.role || (adm.role_id === 3 ? "superadmin" : "admin")}
                          </Badge>
                          {adm.role_id && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
                              ID #{adm.role_id}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {adm.created_at ? new Date(adm.created_at).toLocaleDateString() : "Default"}
                      </TableCell>
                      <TableCell className="text-right">
                        {adm.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteAdmin(adm.id!, adm.email)}
                            disabled={user?.email?.toLowerCase() === adm.email.toLowerCase()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add New Admin Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> Add New Administrator
            </DialogTitle>
            <DialogDescription>
              Create credentials for an administrator. Stored directly in the Supabase <code className="font-mono text-xs">admins</code> table.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAdmin} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="admin-name">Full Name</Label>
              <Input
                id="admin-name"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-email-input">Admin Email *</Label>
              <Input
                id="admin-email-input"
                type="email"
                required
                placeholder="admin@polaris.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password-input">Admin Password *</Label>
              <Input
                id="admin-password-input"
                type="password"
                required
                placeholder="Enter strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-role-select">Role</Label>
              <select
                id="admin-role-select"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {availableRoles.length > 0 ? (
                  availableRoles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name === 'admin' ? 'Administrator' : r.name === 'superadmin' ? 'Super Administrator' : r.name} (Role ID #{r.id})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="admin">Administrator (Role ID #1)</option>
                    <option value="superadmin">Super Administrator (Role ID #3)</option>
                  </>
                )}
              </select>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Create Admin"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
