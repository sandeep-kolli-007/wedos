"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Circle, Plus, Search } from "lucide-react";

type Task = { id: string; title: string; description?: string | null; status: string; priority: string; due_at: string | null; wedding_id: string | null };
type Wedding = { id: string; title: string };
const priorityTone: Record<string,string> = { urgent: "#f6e5e2", high: "#f8edda", normal: "#e9eee8", low: "#eff0ec" };

export default function TasksPage() {
  const [tasks,setTasks]=useState<Task[]>([]);
  const [weddings,setWeddings]=useState<Wedding[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("Open");
  const [title,setTitle]=useState("");
  const [priority,setPriority]=useState("normal");
  const [due,setDue]=useState("");
  const [weddingId,setWeddingId]=useState("");
  const [busy,setBusy]=useState(false);
  async function load() {
    setLoading(true); setError("");
    try {
      const [taskResponse,weddingResponse]=await Promise.all([fetch("/api/tasks",{cache:"no-store"}),fetch("/api/weddings",{cache:"no-store"})]);
      const [taskData,weddingData]=await Promise.all([taskResponse.json(),weddingResponse.json()]);
      if(!taskResponse.ok)throw new Error(taskData.error||"Unable to load tasks");
      if(!weddingResponse.ok && weddingResponse.status!==401)throw new Error(weddingData.error||"Unable to load weddings");
      setTasks(taskData.tasks||[]);setWeddings(weddingData.weddings||[]);
    } catch(cause){setError(cause instanceof Error?cause.message:"Unable to load tasks");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  async function createTask(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!title.trim())return;setBusy(true);setError("");
    try{
      const response=await fetch("/api/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:title.trim(),priority,due_at:due?new Date(due).toISOString():null,wedding_id:weddingId||null})});
      const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Unable to create task");
      setTasks(prev=>[payload.task,...prev]);setTitle("");setDue("");setPriority("normal");setWeddingId("");
    }catch(cause){setError(cause instanceof Error?cause.message:"Unable to create task");}
    finally{setBusy(false);}
  }
  async function toggle(task:Task){
    const done=task.status!=="done";
    try{
      const response=await fetch("/api/tasks",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:task.id,done})});
      const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Unable to update task");
      setTasks(prev=>prev.map(item=>item.id===task.id?{...item,status:done?"done":"todo"}:item));
    }catch(cause){setError(cause instanceof Error?cause.message:"Unable to update task");}
  }
  const filtered=useMemo(()=>tasks.filter(task=>(task.title+" "+(task.description||"")).toLowerCase().includes(query.toLowerCase())&&(filter==="Everything"||(filter==="Open"?task.status!=="done":task.status==="done"))),[tasks,query,filter]);
  const open=tasks.filter(task=>task.status!=="done").length;
  return <main style={{minHeight:"100vh",background:"#f8f8f5",color:"#202322",padding:"24px clamp(16px,4vw,56px) 60px",fontFamily:"DM Sans, sans-serif"}}>
    <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,borderBottom:"1px solid #e6e8e2",paddingBottom:18}}><Link href="/" style={{display:"inline-flex",alignItems:"center",gap:8,fontSize:13}}><ArrowLeft size={16}/> Dashboard</Link><span style={{letterSpacing:2,fontSize:11,color:"#718075"}}>WEDOS / TASKS</span><Link href="/weddings" style={{fontSize:12,fontWeight:700,color:"#244b3c"}}>Wedding workspaces ↗</Link></header>
    <section style={{padding:"32px 0 24px"}}><div style={{color:"#8b9189",fontSize:10,letterSpacing:2,fontWeight:700}}>PLANNING WORK, ACCOUNTED FOR</div><h1 style={{fontSize:"clamp(30px,4vw,44px)",letterSpacing:-1.5,margin:"8px 0"}}>Tasks & approvals</h1><p style={{color:"#777e76",fontSize:14,margin:0}}>{open} open tasks across your workspace. Changes are saved to your account.</p></section>
    {error&&<div role="alert" style={{background:"#f9e8e4",color:"#873d32",borderRadius:10,padding:14,marginBottom:14}}>{error} <button onClick={()=>void load()} style={{marginLeft:8,textDecoration:"underline",border:0,background:"transparent",color:"inherit"}}>Retry</button></div>}
    <section style={{display:"grid",gridTemplateColumns:"minmax(260px,0.85fr) minmax(0,1.5fr)",gap:16,alignItems:"start"}}>
      <form onSubmit={createTask} style={{background:"white",border:"1px solid #e6e8e2",borderRadius:14,padding:20,display:"grid",gap:13}}><h2 style={{fontSize:16,margin:0}}>Create a task</h2><label style={{fontSize:11,fontWeight:700}}>Task title<input required maxLength={180} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Confirm the venue layout" style={field}/></label><label style={{fontSize:11,fontWeight:700}}>Wedding workspace<select value={weddingId} onChange={e=>setWeddingId(e.target.value)} style={field}><option value="">Workspace-wide</option>{weddings.map(wedding=><option key={wedding.id} value={wedding.id}>{wedding.title}</option>)}</select></label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><label style={{fontSize:11,fontWeight:700}}>Priority<select value={priority} onChange={e=>setPriority(e.target.value)} style={field}>{["low","normal","high","urgent"].map(value=><option key={value}>{value}</option>)}</select></label><label style={{fontSize:11,fontWeight:700}}>Due date<input type="datetime-local" value={due} onChange={e=>setDue(e.target.value)} style={field}/></label></div><button disabled={busy} type="submit" style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,background:"#244b3c",color:"white",border:0,borderRadius:9,padding:12,fontSize:12,fontWeight:700,opacity:busy?.7:1}}><Plus size={15}/>{busy?"Saving…":"Save task"}</button></form>
      <section style={{background:"white",border:"1px solid #e6e8e2",borderRadius:14,overflow:"hidden"}}><header style={{display:"flex",flexWrap:"wrap",gap:10,padding:15,borderBottom:"1px solid #eff0ec"}}><label style={{display:"flex",alignItems:"center",gap:8,flex:"1 1 180px",border:"1px solid #e4e7e0",borderRadius:9,padding:"0 10px"}}><Search size={15} color="#858b83"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tasks" style={{border:0,outline:0,padding:10,width:"100%",fontSize:12}}/></label><select value={filter} onChange={e=>setFilter(e.target.value)} style={{border:"1px solid #e4e7e0",borderRadius:9,padding:"0 10px"}}>{["Open","Everything","Completed"].map(value=><option key={value}>{value}</option>)}</select></header>
      {loading?<p style={{padding:20,color:"#777e76"}}>Loading tasks…</p>:filtered.length===0?<div style={{padding:36,textAlign:"center"}}><Check size={24} color="#64816e"/><h3 style={{fontSize:16}}>{tasks.length?"No tasks match this view":"No tasks yet"}</h3><p style={{fontSize:12,color:"#777e76"}}>Create a task to get your planning workflow moving.</p></div>:filtered.map(task=><article key={task.id} style={{display:"flex",gap:12,alignItems:"center",padding:15,borderBottom:"1px solid #eff0ec"}}><button onClick={()=>void toggle(task)} aria-label={task.status==="done"?"Reopen task":"Complete task"} style={{border:0,background:"transparent",color:task.status==="done"?"#47765b":"#a0a69e",padding:0}}>{task.status==="done"?<Check size={19}/>:<Circle size={19}/>}</button><div style={{minWidth:0,flex:1}}><strong style={{fontSize:13,textDecoration:task.status==="done"?"line-through":"none",color:task.status==="done"?"#858b83":"#202322"}}>{task.title}</strong><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:5,fontSize:10,color:"#858b83"}}>{task.wedding_id&&<Link href={"/weddings/"+task.wedding_id} style={{color:"#244b3c"}}>{weddings.find(w=>w.id===task.wedding_id)?.title||"Wedding"} ↗</Link>}<span>{task.due_at?"Due "+new Date(task.due_at).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}):"No due date"}</span></div></div><span style={{fontSize:10,padding:"5px 8px",borderRadius:6,background:priorityTone[task.priority]||"#eff0ec",textTransform:"capitalize"}}>{task.priority}</span></article>)}</section>
    </section>
    <style jsx>{`@media(max-width:760px){section[style*="minmax(260px"]{grid-template-columns:1fr!important}}`}</style>
  </main>;
}
const field: React.CSSProperties = {display:"block",width:"100%",marginTop:7,border:"1px solid #e4e7e0",borderRadius:9,padding:11,fontSize:12,background:"white",color:"#202322",minWidth:0};
