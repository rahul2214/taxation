"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc, DocumentData } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { updatePassword } from "firebase/auth";
import { getCustomer, upsertCustomer } from "@/lib/supabase/services";

export default function AccountPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `customers/${user.uid}`);
  }, [user, firestore]);

  const { data: userData, isLoading } = useDoc(userDocRef);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  useEffect(() => {
    async function loadCustomerFromSupabase() {
      if (!user) return;
      try {
        const c = await getCustomer(user.uid);
        if (c) {
          if (c.first_name) setFirstName(c.first_name);
          if (c.last_name) setLastName(c.last_name);
          if (c.phone) setPhone(c.phone);
          if (c.address && typeof c.address === 'string') {
            setAddress1(c.address);
          }
        }
      } catch (err) {
        console.error("Error loading customer from Supabase:", err);
      }
    }
    loadCustomerFromSupabase();
  }, [user]);

  useEffect(() => {
    if (userData) {
      if (userData.firstName) setFirstName(userData.firstName);
      if (userData.lastName) setLastName(userData.lastName);
      if (userData.phone) setPhone(userData.phone);
      if (userData.address?.line1) setAddress1(userData.address.line1);
      if (userData.address?.line2) setAddress2(userData.address.line2);
      if (userData.address?.city) setCity(userData.address.city);
      if (userData.address?.state) setState(userData.address.state);
      if (userData.address?.zip) setZip(userData.address.zip);
    }
  }, [userData]);
  
  const handleProfileSave = async () => {
    if (user) {
      try {
        await upsertCustomer({
          id: user.uid,
          first_name: firstName,
          last_name: lastName,
          email: user.email || "",
          phone,
        });
      } catch (sbErr) {
        console.warn("Supabase profile save warning:", sbErr);
      }
    }

    if (userDocRef) {
      updateDocumentNonBlocking(userDocRef, {
        firstName,
        lastName,
        phone
      });
    }
    toast({ title: "Profile Updated", description: "Your profile information has been saved." });
  };

  const handleAddressSave = async () => {
    const fullAddress = [address1, address2, city, state, zip].filter(Boolean).join(", ");
    if (user) {
      try {
        await upsertCustomer({
          id: user.uid,
          email: user.email || "",
          address: fullAddress,
        });
      } catch (sbErr) {
        console.warn("Supabase address save warning:", sbErr);
      }
    }

    if (userDocRef) {
      updateDocumentNonBlocking(userDocRef, {
        address: {
          line1: address1,
          line2: address2,
          city,
          state,
          zip
        }
      });
    }
    toast({ title: "Address Updated", description: "Your mailing address has been saved." });
  };
  
  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "New passwords do not match." });
      return;
    }
    if (user) {
      try {
        await updatePassword(user, newPassword);
        toast({ title: "Password Updated", description: "Your password has been changed successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
      }
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Account</h1>
        <p className="text-muted-foreground">Manage your account settings and personal information.</p>
      </div>
      <Separator />
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} disabled={isLoading} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user?.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={isLoading} />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleProfileSave}>Save Changes</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Mailing Address</CardTitle>
          <CardDescription>Your primary mailing address for correspondence.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address1">Address Line 1</Label>
            <Input id="address1" value={address1} onChange={e => setAddress1(e.target.value)} disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address2">Address Line 2 (Optional)</Label>
            <Input id="address2" value={address2} onChange={e => setAddress2(e.target.value)} disabled={isLoading} />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={e => setCity(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={state} onChange={e => setState(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">Zip Code</Label>
              <Input id="zip" value={zip} onChange={e => setZip(e.target.value)} disabled={isLoading} />
            </div>
          </div>
        </CardContent>
         <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleAddressSave}>Save Address</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password for better security.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
        </CardContent>
         <CardFooter className="border-t px-6 py-4">
            <Button onClick={handlePasswordUpdate}>Update Password</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
