"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, CircleUserRound, LoaderCircle, Plus, Search, Users, UserRoundCheck } from "lucide-react";

type Wedding = { id: string; title: string; couple_names: string | null };
type Guest = {
  id: string; wedding_id: string; first_name: string; last_name: string | null; email: string | null;
  phone: string | null; side: string; rsvp_status: string; party_size: number;
  dietary_notes: string | null; notes: string | null;
};

export default function GuestsPage() {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [weddingId, setWeddingId] = useState("");
  const [query, setQuery] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [side, setSide] = useState("other");
  const [partySize, setPartySize] = useState("1");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rsvp, setRsvp] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/weddings", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load weddings");
        if (cancelled) return;
        const list = (payload.weddings || []) as Wedding[];
        setWeddings(list);
        if (list[0]) setWeddingId(list[0].id);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load weddings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!weddingId) { setGuests([]); return; }
    let cancelled = false;
    fetch("/api/guests?wedding_id=" + encodeURIComponent(weddingId), { cache: "no-store" })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load guests");
        return payload;
      }).then(payload => { if (!cancelled) setGuests(payload.guests || []); })
      .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load guests"); });
    return () => { cancelled = true; };
  }, [weddingId]);

  const visible = useMemo(() => guests.filter(guest =>
    (guest.first_name + " " + (guest.last_name || "") + " " + (guest.email || "") + " " + (guest.phone || "")).toLowerCase().includes(query.toLowerCase())
  ), [guests, query]);
  const attending = guests.filter(guest => guest.rsvp_status === "attending").reduce((sum, guest) => sum + guest.party_size, 0);
  const invited = guests.filter(guest => guest.rsvp_status === "invited" || guest.rsvp_status === "attending").length;
  const pending = guests.filter(guest => guest.rsvp_status === "pending").length;

  async function addGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!weddingId) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/guests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wedding_id: weddingId, first_name: firstName, last_name: lastName, side, party_size: Number(partySize), email, phone, rsvp_status: rsvp }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to add guest");
      setGuests(current => [...current, payload.guest].sort((a, b) => (a.last_name || a.first_name).localeCompare(b.last_name || b.first_name)));
      setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setPartySize("1"); setSide("other"); setRsvp("pending");
      setNotice("Guest added to the wedding list.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to add guest");
    } finally { setSaving(false); }
  }

  async function updateRsvp(guest: Guest, status: string) {
    setError(""); setNotice("");
    try {
      const response = await fetch("/api/guests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: guest.id, rsvp_status: status }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to update RSVP");
      setGuests(current => current.map(item => item.id === guest.id ? { ...item, rsvp_status: status } : item));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update RSVP"); }
  }

  const field: React.CSSProperties = { width: "100%", padding: "11px 12px", border: "1px solid #e1e5de", borderRadius: 8, background: "#fff", color: "#26352d", fontSize: 13, minWidth: 0 };
  const label: React.CSSProperties = { display: "grid", gap: 6, fontSize: 11, fontWeight: 700, color: "#5e6b61" };
  return <main style={{ minHeight: "100vh", background: "#f7f8f5", color: "#202923", padding: "24px clamp(16px,4vw,56px) 60px", fontFamily: "DM Sans, sans-serif" }}>
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, borderBottom: "1px solid #e3e7e0", paddingBottom: 18 }}>
      <Link href="/my-wedding" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}><ArrowLeft size={16}/> My wedding</Link>
      <span style={{ letterSpacing: 2, fontSize: 11, color: "#718075" }}>WEDOS / GUEST MANAGEMENT</span>
      <Link href="/my-wedding/details" style={{ fontSize: 12, fontWeight: 700, color: "#244b3c" }}>Wedding details ↗</Link>
    </header>
    <section style={{ display: "flex", flexWrap: "wrap", alignItems: "end", justifyContent: "space-between", gap: 18, padding: "32px 0 24px" }}>
      <div><div style={{ color: "#8b9189", fontSize: 10, letterSpacing: 2, fontWeight: 700 }}>GUESTS & RSVP</div><h1 style={{ fontSize: "clamp(30px,4vw,44px)", letterSpacing: -1.5, margin: "8px 0" }}>Guest list</h1><p style={{ color: "#777e76", fontSize: 14, margin: 0 }}>Keep invitations and responses connected to your wedding.</p></div>
      <label style={{ ...label, minWidth: 230 }}>Wedding<select value={weddingId} onChange={event => setWeddingId(event.target.value)} style={field} disabled={!weddings.length}><option value="">Choose wedding</option>{weddings.map(wedding => <option key={wedding.id} value={wedding.id}>{wedding.couple_names || wedding.title}</option>)}</select></label>
    </section>
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 18 }}>
      {[{ title: "Guests on list", value: String(guests.length), icon: Users }, { title: "Attending guests", value: String(attending), icon: UserRoundCheck }, { title: "Invitations sent", value: String(invited), icon: Check }, { title: "Awaiting RSVP", value: String(pending), icon: CircleUserRound }].map(item => { const Icon = item.icon; return <article key={item.title} style={{ background: "#fff", border: "1px solid #e3e7e0", borderRadius: 12, padding: 16 }}><Icon size={17} color="#587563"/><div style={{ fontSize: 11, color: "#7a837b", marginTop: 14 }}>{item.title}</div><strong style={{ display: "block", fontSize: 25, letterSpacing: -1, marginTop: 4 }}>{item.value}</strong></article>; })}
    </section>
    {error && <div role="alert" style={{ padding: 12, borderRadius: 9, background: "#fae8e4", color: "#853c32", marginBottom: 12 }}>{error}</div>}
    {notice && <div role="status" style={{ padding: 12, borderRadius: 9, background: "#e7f1e9", color: "#28533e", marginBottom: 12 }}>{notice}</div>}
    {!loading && !weddings.length ? <section style={{ background: "#fff", border: "1px solid #e3e7e0", borderRadius: 14, padding: 24 }}><h2 style={{ marginTop: 0 }}>Create your wedding first</h2><p style={{ color: "#737d74" }}>Your guest list belongs to a specific wedding workspace.</p><Link href="/my-wedding/details" style={{ color: "#244b3c", fontWeight: 700 }}>Add wedding details</Link></section> :
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: 16, alignItems: "start" }}>
      <form onSubmit={addGuest} style={{ background: "#fff", border: "1px solid #e3e7e0", borderRadius: 13, padding: 18, display: "grid", gap: 13 }}>
        <div><div style={{ color: "#8b9189", fontSize: 10, letterSpacing: 1.5, fontWeight: 700 }}>ADD PERSON</div><h2 style={{ fontSize: 18, margin: "6px 0 0" }}>New guest</h2></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}><label style={label}>First name<input required maxLength={80} value={firstName} onChange={e => setFirstName(e.target.value)} style={field} placeholder="First name"/></label><label style={label}>Last name<input maxLength={80} value={lastName} onChange={e => setLastName(e.target.value)} style={field} placeholder="Last name"/></label></div>
        <label style={label}>Guest side<select value={side} onChange={e => setSide(e.target.value)} style={field}><option value="bride">Bride&apos;s family</option><option value="groom">Groom&apos;s family</option><option value="shared">Shared</option><option value="other">Other</option></select></label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}><label style={label}>Party size<input type="number" min="1" max="20" step="1" required value={partySize} onChange={e => setPartySize(e.target.value)} style={field}/></label><label style={label}>RSVP status<select value={rsvp} onChange={e => setRsvp(e.target.value)} style={field}><option value="pending">Pending</option><option value="invited">Invited</option><option value="attending">Attending</option><option value="declined">Declined</option></select></label></div>
        <label style={label}>Email <span style={{ fontWeight: 400 }}>Optional</span><input type="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} style={field} placeholder="guest@example.com"/></label>
        <label style={label}>Phone <span style={{ fontWeight: 400 }}>Optional</span><input maxLength={40} value={phone} onChange={e => setPhone(e.target.value)} style={field} placeholder="+91…"/></label>
        <button type="submit" disabled={saving || !weddingId} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, border: 0, borderRadius: 8, background: "#244b3c", color: "#fff", padding: 12, fontSize: 12, fontWeight: 700, cursor: saving || !weddingId ? "not-allowed" : "pointer", opacity: saving || !weddingId ? .6 : 1 }}>{saving ? <LoaderCircle size={15}/> : <Plus size={15}/>} Add guest</button>
      </form>
      <section style={{ background: "#fff", border: "1px solid #e3e7e0", borderRadius: 13, padding: 18, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 15 }}><div><h2 style={{ margin: 0, fontSize: 18 }}>Wedding guests</h2><p style={{ color: "#7a837b", fontSize: 12, margin: "5px 0 0" }}>{visible.length} people shown</p></div><label style={{ display: "flex", alignItems: "center", gap: 7, border: "1px solid #e1e5de", borderRadius: 8, padding: "0 10px", flex: "1 1 190px", maxWidth: 260 }}><Search size={15} color="#849087"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search guests" style={{ border: 0, outline: 0, padding: 10, width: "100%", minWidth: 0, fontSize: 12 }}/></label></div>
        {loading ? <p style={{ color: "#7a837b", fontSize: 13 }}>Loading guest list…</p> : !visible.length ? <div style={{ textAlign: "center", padding: "38px 12px", color: "#778178" }}><Users size={25} style={{ margin: "0 auto 12px" }}/><strong style={{ display: "block", color: "#34443a", fontSize: 14 }}>{query ? "No matching guests" : "Your guest list starts here"}</strong><p style={{ fontSize: 12 }}>{query ? "Try another name, email or phone." : "Add family and friends, then keep RSVP responses up to date."}</p></div> :
          <div style={{ display: "grid", gap: 0 }}>{visible.map(guest => <article key={guest.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", alignItems: "center", gap: 12, padding: "13px 0", borderTop: "1px solid #edf0eb" }}><div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}><span style={{ width: 36, height: 36, borderRadius: 10, background: "#eef2ed", color: "#365744", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{(guest.first_name[0] || "G") + ((guest.last_name || "")[0] || "")}</span><div style={{ minWidth: 0 }}><strong style={{ display: "block", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>{guest.first_name} {guest.last_name || ""}</strong><small style={{ color: "#7a837b", fontSize: 11 }}>{guest.side} · Party of {guest.party_size}{guest.email ? " · " + guest.email : ""}</small></div></div><label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#647268" }}><span className="sr-only">RSVP for {guest.first_name}</span><select aria-label={"RSVP status for " + guest.first_name} value={guest.rsvp_status} onChange={e => void updateRsvp(guest, e.target.value)} style={{ ...field, width: "auto", padding: "8px 26px 8px 9px", fontSize: 11 }}><option value="pending">Pending</option><option value="invited">Invited</option><option value="attending">Attending</option><option value="declined">Declined</option></select><ChevronDown size={13}/></label></article>)}</div>}
      </section>
    </section>}
  </main>;
}
