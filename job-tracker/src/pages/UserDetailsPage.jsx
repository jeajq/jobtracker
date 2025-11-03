// import React, { useMemo, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Switch } from "@/components/ui/switch";
// import { Badge } from "@/components/ui/badge";
// import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// import { Separator } from "@/components/ui/separator";
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// import { Bell, Lock, Mail, MapPin, Phone, Save, Shield, Undo2, Upload, User as UserIcon } from "lucide-react";

// /**
//  * Drop this component into your routes, e.g. <Route path="/account" element={<UserDetailsPage />} />
//  *
//  * Props (optional):
//  * - initialUser: a user object to prefill the form
//  * - onSave: (updatedUser) => void
//  */
// export default function UserDetailsPage({ initialUser, onSave }) {
//   const [user, setUser] = useState(
//     initialUser ?? {
//       id: "u_001",
//       role: "employer", // or "seeker"
//       status: "Active",
//       firstName: "Moneli",
//       lastName: "Peries",
//       email: "moneli@example.com",
//       phone: "+61 400 000 000",
//       bio: "Team-first software engineering student at UTS. Building a Job Tracker app.",
//       company: "Optik Engineering",
//       jobTitle: "Software Engineering Student",
//       address: {
//         line1: "15 Broadway",
//         line2: "",
//         city: "Ultimo",
//         state: "NSW",
//         postcode: "2007",
//         country: "Australia",
//       },
//       preferences: {
//         newsletter: true,
//         productUpdates: true,
//         jobAlerts: true,
//         darkMode: true,
//         timezone: "Australia/Melbourne",
//       },
//       security: {
//         mfa: true,
//         lastPasswordChange: "2025-09-12",
//       },
//       avatarUrl: "",
//     }
//   );

//   const initials = useMemo(() => {
//     const f = user.firstName?.[0] ?? "U";
//     const l = user.lastName?.[0] ?? "";
//     return (f + l).toUpperCase();
//   }, [user.firstName, user.lastName]);

//   const [saving, setSaving] = useState(false);
//   const [tab, setTab] = useState("profile");

//   function handleField(path, value) {
//     setUser((prev) => {
//       const copy = structuredClone(prev);
//       // simple path setter: e.g., "address.city"
//       const keys = path.split(".");
//       let obj = copy;
//       for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
//       obj[keys[keys.length - 1]] = value;
//       return copy;
//     });
//   }

//   async function handleSave() {
//     setSaving(true);
//     try {
//       // Simulate async save
//       await new Promise((r) => setTimeout(r, 600));
//       onSave?.(user);
//     } finally {
//       setSaving(false);
//     }
//   }

//   function handleReset() {
//     if (!initialUser) return;
//     setUser(initialUser);
//   }

//   function onAvatarSelect(e) {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = () => handleField("avatarUrl", reader.result);
//     reader.readAsDataURL(file);
//   }

//   return (
//     <div className="mx-auto max-w-6xl p-6">
//       {/* Page header */}
//       <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//         <div className="flex items-center gap-4">
//           <Avatar className="h-16 w-16 rounded-2xl shadow">
//             {user.avatarUrl ? (
//               <AvatarImage src={user.avatarUrl} alt={user.firstName} />
//             ) : (
//               <AvatarFallback className="text-lg">{initials}</AvatarFallback>
//             )}
//           </Avatar>
//           <div>
//             <div className="flex items-center gap-2">
//               <h1 className="text-2xl font-semibold tracking-tight">
//                 {user.firstName} {user.lastName}
//               </h1>
//               <Badge variant="secondary">{user.status}</Badge>
//             </div>
//             <p className="text-sm text-muted-foreground">
//               {user.jobTitle} • {user.company}
//             </p>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           <TooltipProvider>
//             <Tooltip>
//               <TooltipTrigger asChild>
//                 <div>
//                   <Input id="avatar" type="file" accept="image/*" onChange={onAvatarSelect} className="hidden" />
//                   <Button asChild variant="outline">
//                     <label htmlFor="avatar" className="flex cursor-pointer items-center gap-2">
//                       <Upload className="h-4 w-4" /> Upload avatar
//                     </label>
//                   </Button>
//                 </div>
//               </TooltipTrigger>
//               <TooltipContent>PNG, JPG up to ~2MB</TooltipContent>
//             </Tooltip>
//           </TooltipProvider>
//           <Button onClick={handleSave} disabled={saving} className="gap-2">
//             <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
//           </Button>
//           {initialUser && (
//             <Button variant="ghost" onClick={handleReset} className="gap-2">
//               <Undo2 className="h-4 w-4" /> Reset
//             </Button>
//           )}
//         </div>
//       </div>

//       {/* Body */}
//       <Card className="rounded-2xl">
//         <CardHeader>
//           <CardTitle className="text-lg">Account details</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Tabs value={tab} onValueChange={setTab} className="w-full">
//             <TabsList className="grid w-full grid-cols-5">
//               <TabsTrigger value="profile" className="gap-2">
//                 <UserIcon className="h-4 w-4" /> Profile
//               </TabsTrigger>
//               <TabsTrigger value="contact" className="gap-2">
//                 <Mail className="h-4 w-4" /> Contact
//               </TabsTrigger>
//               <TabsTrigger value="preferences" className="gap-2">
//                 <Bell className="h-4 w-4" /> Preferences
//               </TabsTrigger>
//               <TabsTrigger value="security" className="gap-2">
//                 <Shield className="h-4 w-4" /> Security
//               </TabsTrigger>
//               <TabsTrigger value="activity" className="gap-2">
//                 <Lock className="h-4 w-4" /> Activity
//               </TabsTrigger>
//             </TabsList>

//             {/* Profile */}
//             <TabsContent value="profile" className="mt-6">
//               <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                 <div className="space-y-3">
//                   <Label>First name</Label>
//                   <Input value={user.firstName} onChange={(e) => handleField("firstName", e.target.value)} />
//                 </div>
//                 <div className="space-y-3">
//                   <Label>Last name</Label>
//                   <Input value={user.lastName} onChange={(e) => handleField("lastName", e.target.value)} />
//                 </div>
//                 <div className="space-y-3">
//                   <Label>Role</Label>
//                   <Select value={user.role} onValueChange={(v) => handleField("role", v)}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select role" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="employer">Employer</SelectItem>
//                       <SelectItem value="seeker">Job seeker</SelectItem>
//                       <SelectItem value="admin">Admin</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-3">
//                   <Label>Job title</Label>
//                   <Input value={user.jobTitle} onChange={(e) => handleField("jobTitle", e.target.value)} />
//                 </div>
//                 <div className="space-y-3 md:col-span-2">
//                   <Label>Company / Organisation</Label>
//                   <Input value={user.company} onChange={(e) => handleField("company", e.target.value)} />
//                 </div>
//                 <div className="space-y-3 md:col-span-2">
//                   <Label>Bio</Label>
//                   <Textarea rows={3} value={user.bio} onChange={(e) => handleField("bio", e.target.value)} />
//                 </div>
//               </div>
//             </TabsContent>

//             {/* Contact */}
//             <TabsContent value="contact" className="mt-6">
//               <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                 <div className="space-y-3">
//                   <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</Label>
//                   <Input type="email" value={user.email} onChange={(e) => handleField("email", e.target.value)} />
//                 </div>
//                 <div className="space-y-3">
//                   <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</Label>
//                   <Input value={user.phone} onChange={(e) => handleField("phone", e.target.value)} />
//                 </div>

//                 <div className="md:col-span-2"><Separator /></div>

//                 <div className="space-y-3 md:col-span-2">
//                   <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Address line 1</Label>
//                   <Input value={user.address.line1} onChange={(e) => handleField("address.line1", e.target.value)} />
//                 </div>
//                 <div className="space-y-3 md:col-span-2">
//                   <Label>Address line 2</Label>
//                   <Input value={user.address.line2} onChange={(e) => handleField("address.line2", e.target.value)} />
//                 </div>

//                 <div className="space-y-3">
//                   <Label>City</Label>
//                   <Input value={user.address.city} onChange={(e) => handleField("address.city", e.target.value)} />
//                 </div>
//                 <div className="space-y-3">
//                   <Label>State</Label>
//                   <Input value={user.address.state} onChange={(e) => handleField("address.state", e.target.value)} />
//                 </div>
//                 <div className="space-y-3">
//                   <Label>Postcode</Label>
//                   <Input value={user.address.postcode} onChange={(e) => handleField("address.postcode", e.target.value)} />
//                 </div>
//                 <div className="space-y-3">
//                   <Label>Country</Label>
//                   <Input value={user.address.country} onChange={(e) => handleField("address.country", e.target.value)} />
//                 </div>
//               </div>
//             </TabsContent>

//             {/* Preferences */}
//             <TabsContent value="preferences" className="mt-6">
//               <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                 <PreferenceRow
//                   label="Receive newsletter"
//                   checked={user.preferences.newsletter}
//                   onCheckedChange={(v) => handleField("preferences.newsletter", v)}
//                 />
//                 <PreferenceRow
//                   label="Product updates"
//                   checked={user.preferences.productUpdates}
//                   onCheckedChange={(v) => handleField("preferences.productUpdates", v)}
//                 />
//                 <PreferenceRow
//                   label="Job alerts"
//                   checked={user.preferences.jobAlerts}
//                   onCheckedChange={(v) => handleField("preferences.jobAlerts", v)}
//                 />
//                 <PreferenceRow
//                   label="Dark mode"
//                   checked={user.preferences.darkMode}
//                   onCheckedChange={(v) => handleField("preferences.darkMode", v)}
//                 />

//                 <div className="space-y-3 md:col-span-2">
//                   <Label>Timezone</Label>
//                   <Select value={user.preferences.timezone} onValueChange={(v) => handleField("preferences.timezone", v)}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Choose timezone" />
//                     </SelectTrigger>
//                     <SelectContent className="max-h-72 overflow-auto">
//                       <SelectItem value="Australia/Melbourne">Australia/Melbourne</SelectItem>
//                       <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
//                       <SelectItem value="Australia/Brisbane">Australia/Brisbane</SelectItem>
//                       <SelectItem value="Australia/Perth">Australia/Perth</SelectItem>
//                       <SelectItem value="UTC">UTC</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//             </TabsContent>

//             {/* Security */}
//             <TabsContent value="security" className="mt-6">
//               <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                 <div className="space-y-3">
//                   <Label className="flex items-center gap-2"><Shield className="h-4 w-4" /> Two-factor authentication (MFA)</Label>
//                   <div className="flex items-center justify-between rounded-2xl border p-4">
//                     <div className="text-sm text-muted-foreground">Increase account security with a second verification step.</div>
//                     <Switch checked={user.security.mfa} onCheckedChange={(v) => handleField("security.mfa", v)} />
//                   </div>
//                 </div>
//                 <div className="space-y-3">
//                   <Label className="flex items-center gap-2"><Lock className="h-4 w-4" /> Change password</Label>
//                   <div className="grid gap-3">
//                     <Input type="password" placeholder="Current password" />
//                     <Input type="password" placeholder="New password" />
//                     <Input type="password" placeholder="Confirm new password" />
//                     <Button variant="secondary">Update password</Button>
//                     <p className="text-xs text-muted-foreground">Last changed on {user.security.lastPasswordChange}</p>
//                   </div>
//                 </div>
//               </div>
//             </TabsContent>

//             {/* Activity */}
//             <TabsContent value="activity" className="mt-6">
//               <div className="space-y-4">
//                 <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
//                   Recent activity appears here (logins, changes, sessions). Hook this up to your API.
//                 </div>
//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                   <div className="rounded-2xl border p-4">
//                     <h3 className="mb-2 font-medium">Sessions</h3>
//                     <ul className="space-y-2 text-sm text-muted-foreground">
//                       <li>Chrome on Windows · Melbourne · Active now</li>
//                       <li>Chrome on Android · Sydney · 2 days ago</li>
//                     </ul>
//                   </div>
//                   <div className="rounded-2xl border p-4">
//                     <h3 className="mb-2 font-medium">Connected apps</h3>
//                     <ul className="space-y-2 text-sm text-muted-foreground">
//                       <li>Google (OAuth) · basic profile</li>
//                       <li>GitHub · public repos</li>
//                     </ul>
//                   </div>
//                 </div>
//               </div>
//             </TabsContent>
//           </Tabs>
//         </CardContent>
//       </Card>

//       {/* Sticky footer actions for small screens */}
//       <div className="pointer-events-none fixed inset-x-0 bottom-4 z-10 flex justify-center px-4 md:hidden">
//         <div className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl border bg-background/80 p-2 shadow-lg backdrop-blur">
//           <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
//             <Save className="h-4 w-4" /> Save
//           </Button>
//           {initialUser && (
//             <Button variant="ghost" className="gap-2" onClick={handleReset}>
//               <Undo2 className="h-4 w-4" /> Reset
//             </Button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// function PreferenceRow({ label, checked, onCheckedChange }) {
//   return (
//     <div className="flex items-center justify-between rounded-2xl border p-4">
//       <div className="text-sm">
//         <div className="font-medium">{label}</div>
//         <div className="text-muted-foreground">Toggle to enable/disable.</div>
//       </div>
//       <Switch checked={checked} onCheckedChange={onCheckedChange} />
//     </div>
//   );
// }

import React from "react";
import Sidebar from "../components/sidebar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser } from "@fortawesome/free-regular-svg-icons";



export default function UserDetailsPage() {
  return (
    <div className="jt-app" style={{ position: "relative" }}>
      <Sidebar/>
      <svg className="user-details-profile-pic" xmlns="http://www.w3.org/2000/svg" width="195" height="203" viewBox="0 0 195 203" fill="none" style={{ position: "absolute", top: "253px", left: "315px" }}>
        <FontAwesomeIcon icon={faCircleUser} size="lg" />
      </svg>

      <div style={{ width: "702px", height: "339px", flexShrink: 0, borderRadius: "10px", background: "#3C3659", width: "702px", height: "339px", position: "absolute", top: "185px", left: "552px" }}>
        <h1 style={{color: "#FFF",
          position: "relative",
          left: "16px",
          fontStyle: "normal",
          fontWeight: 400,
          lineHeight: "normal"}}>
            Account Details
        </h1>
        <div style={{position: "absolute", left: "32px", fontWeight: "bold"}}>
          <p style={{marginBottom: "20px"}}> Name </p>
          <p style={{marginBottom: "20px"}}>Email </p>
          <p style={{marginBottom: "20px"}}>Location </p>
          <p style={{marginBottom: "20px"}}>First Name </p>
          <p style={{marginBottom: "20px"}}>Last Name </p>
          <p style={{marginBottom: "20px"}}>Password </p>
        </div>
        <div style={{position: "absolute", left: "200px"}}>
          <p style={{marginBottom: "20px"}}>fname lname </p>
          <p style={{marginBottom: "20px"}}>fname.lname@example.com </p>
          <p style={{marginBottom: "20px"}}>Sydney, Australia </p>
          <p style={{marginBottom: "20px"}}>fname </p>
          <p style={{marginBottom: "20px"}}>lname </p>
          <p style={{marginBottom: "20px"}}>******** </p>
        </div>
      </div>
    </div>
  );
}