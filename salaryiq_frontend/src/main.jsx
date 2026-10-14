import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Activity, ArrowRight, BarChart3, BriefcaseBusiness, Check, ChevronDown, CircleHelp, Cpu, Database, Gauge, LayoutDashboard, Menu, Moon, Network, RefreshCw, Search, Settings2, ShieldCheck, Sparkles, Terminal, TrendingUp, UserRound, Wallet, X } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import './style.css';

const API = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');
const nav = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'predictor', label: 'Salary Predictor', icon: Wallet },
  { id: 'analytics', label: 'Salary Analytics', icon: BarChart3 },
  { id: 'performance', label: 'Model Performance', icon: Cpu },
  { id: 'about', label: 'About', icon: CircleHelp },
];
const fallbackMetrics = [
  { model: 'Linear Regression', MAE_USD: 40002.25, RMSE_USD: 53229.84, R2: 0.3522 },
  { model: 'Random Forest', MAE_USD: 39398.01, RMSE_USD: 52829.22, R2: 0.3619 },
];
const initialForm = { work_year: 2023, experience_level: 'SE', employment_type: 'FT', job_title: 'Data Scientist', employee_residence: 'US', remote_ratio: 100, company_location: 'US', company_size: 'M' };
const experienceLabels = { EN: 'Entry level', MI: 'Mid level', SE: 'Senior level', EX: 'Executive' };
const currency = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n || 0));
const number = n => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(n || 0));

function App() {
  const [page, setPage] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const [metrics, setMetrics] = useState(fallbackMetrics);
  const [form, setForm] = useState(initialForm);
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState('');
  const [lastChecked, setLastChecked] = useState(null);

  const checkApi = async () => {
    try { await axios.get(`${API}/health`, { timeout: 2500 }); setApiStatus('online'); }
    catch { setApiStatus('offline'); }
    setLastChecked(new Date());
  };
  const loadMetrics = async () => {
    try {
      const res = await axios.get(`${API}/models/metrics`, { timeout: 4000 });
      const raw = Array.isArray(res.data) ? res.data : (res.data?.metrics || res.data?.data || []);
      if (raw.length) {
        const normalized = raw.map(r => ({
          model: r.model || r.Model || r.model_name || r.ModelName || 'Model',
          MAE_USD: Number(r.MAE_USD ?? r.mae_usd ?? r.MAE ?? r.mae),
          RMSE_USD: Number(r.RMSE_USD ?? r.rmse_usd ?? r.RMSE ?? r.rmse),
          R2: Number(r.R2 ?? r.r2 ?? r.R2_Score ?? r.r2_score ?? r['R²'] ?? r.R2_score),
        })).filter(r => Number.isFinite(r.MAE_USD) && Number.isFinite(r.RMSE_USD));
        if (normalized.length) setMetrics(normalized);
      }
    } catch { /* Keep the known training metrics visible if the endpoint is temporarily unavailable. */ }
  };
  useEffect(() => { checkApi(); loadMetrics(); }, []);
  const best = useMemo(() => [...metrics].sort((a,b) => a.MAE_USD - b.MAE_USD)[0] || fallbackMetrics[1], [metrics]);
  const bestR2 = Number.isFinite(best.R2) ? best.R2 : (best.model.toLowerCase().includes('forest') ? 0.3619 : 0.3522);

  const runPrediction = async e => {
    e.preventDefault(); setPredicting(true); setError(''); setPrediction(null);
    try {
      const res = await axios.post(`${API}/predict`, { ...form, work_year: Number(form.work_year), remote_ratio: Number(form.remote_ratio) }, { timeout: 15000 });
      const amount = res.data?.predicted_salary_usd ?? res.data?.predicted_salary ?? res.data?.prediction;
      if (amount === undefined) throw new Error('The API response did not include a predicted salary. Check the Flask /predict response.');
      setPrediction({ amount: Number(amount), model: res.data?.model || 'Configured model', note: res.data?.note || 'Estimate based on historical salary records.' });
      setPage('predictor');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Could not reach the prediction API.');
    } finally { setPredicting(false); }
  };
  const change = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const go = id => { setPage(id); setMobileOpen(false); setError(''); };

  return <div className="app-shell">
    {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div>
        <div className="brand"><div className="brand-mark"><TrendingUp size={21}/></div><div><b>SalaryIQ</b><span>CAREER INTELLIGENCE</span></div><button className="icon-btn sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
        <div className="environment"><span>ENVIRONMENT</span><b><i/> LOCAL DEV</b></div>
        <nav className="navigation">{nav.map(item => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => go(item.id)}><Icon size={18}/><span>{item.label}</span>{page === item.id && <span className="nav-dot"/>}</button>; })}</nav>
      </div>
      <div className="sidebar-bottom"><div className="model-mini"><div className="mini-top"><span>MODEL STATUS</span><span className={apiStatus === 'online' ? 'text-teal' : apiStatus === 'offline' ? 'text-amber' : ''}>{apiStatus === 'online' ? 'ONLINE' : apiStatus === 'offline' ? 'OFFLINE' : 'CHECKING'}</span></div><div className="mini-bar"><span style={{width: `${Math.max(12, Math.min(100, bestR2 * 100))}%`}}/></div><div className="mini-bottom"><span>Best MAE</span><b>{currency(best.MAE_USD)}</b></div></div><div className="sidebar-foot"><span className="status-pip"/> Models trained locally <span className="version">v1.0</span></div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="crumb"><button className="icon-btn mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20}/></button><span>Workspace</span><span className="crumb-sep">/</span><b>{nav.find(n => n.id === page)?.label || 'Overview'}</b></div><div className="top-actions"><div className={`connection ${apiStatus}`}><span className="status-pip"/>{apiStatus === 'online' ? 'Backend connected' : apiStatus === 'offline' ? 'Backend offline' : 'Checking backend'}</div><button className="icon-btn" onClick={() => {checkApi(); loadMetrics();}} title="Refresh backend status"><RefreshCw size={17}/></button><div className="avatar"><UserRound size={17}/></div></div></header>
      <main className="content"><motion.div key={page} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.22}}>
        {page === 'overview' && <Overview metrics={metrics} best={best} bestR2={bestR2} apiStatus={apiStatus} onPredict={() => go('predictor')} onPerformance={() => go('performance')} />}
        {page === 'predictor' && <Predictor form={form} change={change} onSubmit={runPrediction} predicting={predicting} prediction={prediction} error={error} setForm={setForm} />}
        {page === 'analytics' && <Analytics metrics={metrics} />}
        {page === 'performance' && <Performance metrics={metrics} />}
        {page === 'about' && <About apiStatus={apiStatus} />}
      </motion.div><footer className="page-footer"><span>SalaryIQ · Machine-learning salary estimation</span><span>USD unless stated otherwise · Estimates are not guarantees</span></footer></main>
    </div>
  </div>;
}

function PageHeading({eyebrow, title, subtitle, action}) { return <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/>{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>; }
function StatCard({label, value, hint, icon: Icon, tone='purple'}) { return <div className={`stat-card tone-${tone}`}><div className="stat-heading"><span>{label}</span><span className="stat-icon"><Icon size={18}/></span></div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div><div className="stat-accent"/></div>; }
function Panel({title, subtitle, children, action}) { return <section className="panel"><div className="panel-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>; }
function Overview({metrics,best,bestR2,apiStatus,onPredict,onPerformance}) {
  const comparison = metrics.map(m => ({name:m.model.replace('Linear Regression','Linear Reg.'), MAE:Math.round(m.MAE_USD), RMSE:Math.round(m.RMSE_USD)}));
  return <>
    <PageHeading eyebrow="CAREER DATA · MODEL INSIGHTS" title="Compensation intelligence, made practical." subtitle="Explore salary estimates powered by your trained machine-learning models." action={<button className="btn btn-primary" onClick={onPredict}><Sparkles size={16}/> New prediction <ArrowRight size={16}/></button>} />
    <div className="stat-grid"><StatCard label="Best model MAE" value={currency(best.MAE_USD)} hint="Average absolute prediction error" icon={Gauge} tone="purple"/><StatCard label="Best model RMSE" value={currency(best.RMSE_USD)} hint="Penalizes larger prediction errors" icon={Activity} tone="teal"/><StatCard label="Model R² score" value={Number.isFinite(bestR2) ? bestR2.toFixed(3) : '—'} hint="Explained variance on evaluation data" icon={Network} tone="amber"/><StatCard label="API status" value={apiStatus === 'online' ? 'Connected' : apiStatus === 'offline' ? 'Offline' : 'Checking'} hint={apiStatus === 'online' ? 'Flask service responded' : 'Start your Flask backend on port 5000'} icon={Database} tone={apiStatus === 'online' ? 'teal' : 'purple'}/></div>
    <div className="dashboard-grid"><Panel title="Model error comparison" subtitle="Lower is better · values in USD" action={<button className="text-action" onClick={onPerformance}>Full report <ArrowRight size={14}/></button>}><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={comparison} margin={{top:8,right:8,left:0,bottom:4}}><CartesianGrid strokeDasharray="3 3" stroke="#2b3042" vertical={false}/><XAxis dataKey="name" stroke="#858ba4" tickLine={false} axisLine={false} fontSize={11}/><YAxis stroke="#858ba4" tickLine={false} axisLine={false} fontSize={11} tickFormatter={v=>`$${Math.round(v/1000)}k`}/><Tooltip contentStyle={{background:'#171c2e',border:'1px solid #34394a',borderRadius:10,color:'#e5e7f5'}} formatter={v=>currency(v)}/><Bar dataKey="MAE" name="MAE" fill="#a39aff" radius={[6,6,0,0]} barSize={38}/><Bar dataKey="RMSE" name="RMSE" fill="#40debb" radius={[6,6,0,0]} barSize={38}/></BarChart></ResponsiveContainer></div><div className="chart-legend"><span><i className="legend-purple"/> MAE</span><span><i className="legend-teal"/> RMSE</span></div></Panel>
      <Panel title="Quick salary estimate" subtitle="Enter a profile to get a model-backed prediction"><div className="quick-predict"><div className="quick-icon"><Wallet size={23}/></div><div><h3>Estimate a compensation range</h3><p>Use job role, seniority, location and work setup to generate an estimate from the trained model.</p></div><button className="btn btn-secondary" onClick={onPredict}>Open predictor <ArrowRight size={15}/></button></div><div className="info-strip"><ShieldCheck size={17}/><span>Predictions are in <b>USD</b> and reflect the dataset's historical patterns—not a guaranteed offer.</span></div></Panel></div>
    <Panel title="Training snapshot" subtitle="Evaluation metrics from your current training run"><div className="table-scroll"><table><thead><tr><th>Model</th><th>Mean absolute error</th><th>Root mean squared error</th><th>R² score</th><th>Status</th></tr></thead><tbody>{metrics.map((m,i)=><tr key={m.model}><td><span className="model-name"><span className={`model-dot ${i===0?'dot-purple':'dot-teal'}`}/>{m.model}</span></td><td>{currency(m.MAE_USD)}</td><td>{currency(m.RMSE_USD)}</td><td>{Number.isFinite(m.R2)?m.R2.toFixed(4):'—'}</td><td><span className={`pill ${m.model===best.model?'pill-good':'pill-neutral'}`}>{m.model===best.model?'Best MAE':'Evaluated'}</span></td></tr>)}</tbody></table></div></Panel>
  </>;
}
function Predictor({form,change,onSubmit,predicting,prediction,error,setForm}) {
  const [showAdvanced,setShowAdvanced] = useState(true);
  return <><PageHeading eyebrow="PREDICTION WORKSPACE" title="Salary Predictor" subtitle="Configure a professional profile and request an estimate from your Flask model." action={<div className="api-tag"><span className="status-pip"/> POST /predict</div>}/>
    <div className="predict-layout"><form className="panel predictor-form" onSubmit={onSubmit}><div className="form-section-title"><span className="step-number">01</span><div><h2>Role & seniority</h2><p>Tell us about the role being evaluated.</p></div></div>
      <div className="form-grid"><label className="field"><span>Job title</span><select name="job_title" value={form.job_title} onChange={change}><option>Data Scientist</option><option>Data Analyst</option><option>Data Engineer</option><option>Machine Learning Engineer</option><option>Analytics Engineer</option><option>Research Scientist</option><option>BI Analyst</option><option>Data Architect</option><option>ML Engineer</option><option>Research Engineer</option><option>Applied Scientist</option></select></label><label className="field"><span>Work year</span><select name="work_year" value={form.work_year} onChange={change}>{[2026,2025,2024,2023,2022,2021,2020].map(y=><option key={y} value={y}>{y}</option>)}</select></label></div>
      <label className="field field-full"><span>Experience level</span><div className="choice-grid four">{[['EN','Entry'],['MI','Mid'],['SE','Senior'],['EX','Executive']].map(([v,label])=><button type="button" key={v} className={`choice ${form.experience_level===v?'selected':''}`} onClick={()=>setForm(p=>({...p,experience_level:v}))}><b>{v}</b><span>{label}</span>{form.experience_level===v&&<Check size={14}/>}</button>)}</div></label>
      <label className="field field-full"><span>Employment type</span><div className="choice-grid four">{[['FT','Full-time'],['PT','Part-time'],['CT','Contract'],['FL','Freelance']].map(([v,label])=><button type="button" key={v} className={`choice ${form.employment_type===v?'selected':''}`} onClick={()=>setForm(p=>({...p,employment_type:v}))}><b>{v}</b><span>{label}</span>{form.employment_type===v&&<Check size={14}/>}</button>)}</div></label>
      <div className="form-divider"/><div className="form-section-title"><span className="step-number">02</span><div><h2>Location & work setup</h2><p>Choose where the employee and company are based.</p></div></div>
      <div className="form-grid"><label className="field"><span>Employee residence (country code)</span><input name="employee_residence" value={form.employee_residence} onChange={change} placeholder="e.g. US" maxLength="2" required pattern="[A-Za-z]{2}" title="Enter a two-letter country code, e.g. US or IN"/><small>Use a 2-letter code from your training data (e.g. US, IN, GB).</small></label><label className="field"><span>Company location (country code)</span><input name="company_location" value={form.company_location} onChange={change} placeholder="e.g. US" maxLength="2" required pattern="[A-Za-z]{2}" title="Enter a two-letter country code, e.g. US or IN"/></label></div>
      <label className="field field-full"><span>Remote ratio <b className="field-value">{form.remote_ratio}% {form.remote_ratio==0?'On-site':form.remote_ratio==50?'Hybrid':'Remote'}</b></span><div className="choice-grid three">{[[0,'On-site'],[50,'Hybrid'],[100,'Fully remote']].map(([v,label])=><button type="button" key={v} className={`choice ${Number(form.remote_ratio)===v?'selected':''}`} onClick={()=>setForm(p=>({...p,remote_ratio:v}))}><span>{label}</span>{Number(form.remote_ratio)===v&&<Check size={14}/>}</button>)}</div></label>
      <label className="field field-full"><span>Company size</span><div className="choice-grid three">{[['S','Small','1–49 employees'],['M','Medium','50–249 employees'],['L','Large','250+ employees']].map(([v,label,sub])=><button type="button" key={v} className={`choice size-choice ${form.company_size===v?'selected':''}`} onClick={()=>setForm(p=>({...p,company_size:v}))}><b>{label}</b><small>{sub}</small>{form.company_size===v&&<Check size={14}/>}</button>)}</div></label>
      {error&&<div className="error-box"><X size={17}/><span>{error}{/Network Error|ECONNREFUSED|timeout/i.test(error)?' Make sure Flask is running at '+API+'.':''}</span></div>}
      <div className="form-submit"><span><ShieldCheck size={16}/> Estimate only · USD output</span><button className="btn btn-primary" type="submit" disabled={predicting}>{predicting?<><RefreshCw size={16} className="spin"/> Calculating…</>:<><Sparkles size={16}/> Predict salary <ArrowRight size={16}/></>}</button></div>
    </form>
    <aside className="result-column"><div className={`result-card ${prediction?'has-result':''}`}><div className="result-top"><div className="result-symbol"><Wallet size={21}/></div><span className="pill pill-neutral">{prediction?'LATEST RESULT':'READY TO ESTIMATE'}</span></div><p className="result-label">Predicted annual salary</p><div className="result-number">{prediction?currency(prediction.amount):'— — —'}</div><div className="result-currency">USD · Gross annual compensation</div>{prediction?<><div className="result-divider"/><div className="result-meta"><span>Model used</span><b>{prediction.model}</b></div><p className="result-note">{prediction.note}</p><button className="btn btn-outline full-width" onClick={()=>window.print()}>Print result <ArrowRight size={15}/></button></>:<div className="empty-result"><div className="empty-graphic"><BarChart3 size={27}/></div><b>Your estimate will appear here</b><p>Complete the profile form and run the prediction to see the model output.</p></div>}</div>
      <div className="panel guidance"><div className="guidance-icon"><CircleHelp size={18}/></div><div><h3>How to read this result</h3><p>The model learns from historical global data-science salaries. Your result is a point estimate, not a salary guarantee or a confidence interval.</p></div></div><div className="panel api-details"><div className="panel-head"><h2>Request details</h2><Terminal size={16}/></div><div className="detail-row"><span>Endpoint</span><code>POST /predict</code></div><div className="detail-row"><span>Backend</span><code>{API}</code></div><div className="detail-row"><span>Response currency</span><b>USD</b></div></div>
    </aside></div></>;
}
function Analytics({metrics}) {
  const data = metrics.map(m=>({name:m.model,MAE:Math.round(m.MAE_USD),RMSE:Math.round(m.RMSE_USD),R2:Number.isFinite(m.R2)?m.R2:0}));
  return <><PageHeading eyebrow="DATA EXPLORATION" title="Salary Analytics" subtitle="Compare the evaluated models using the training report currently exposed by your backend."/><div className="notice"><Database size={18}/><div><b>Analytics data source</b><p>Your current API exposes model metrics, not the raw dataset or grouped salary summaries. These charts use actual evaluation metrics only; market-distribution charts need a dataset analytics endpoint.</p></div></div><div className="dashboard-grid analytics-grid"><Panel title="Prediction error by model" subtitle="MAE and RMSE · USD"><div className="chart-wrap tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{top:8,right:12,left:4,bottom:8}}><CartesianGrid strokeDasharray="3 3" stroke="#2b3042" vertical={false}/><XAxis dataKey="name" stroke="#858ba4" tickLine={false} axisLine={false} fontSize={11}/><YAxis stroke="#858ba4" tickLine={false} axisLine={false} fontSize={11} tickFormatter={v=>`$${Math.round(v/1000)}k`}/><Tooltip contentStyle={{background:'#171c2e',border:'1px solid #34394a',borderRadius:10,color:'#e5e7f5'}} formatter={v=>currency(v)}/><Bar dataKey="MAE" fill="#a39aff" radius={[6,6,0,0]}/><Bar dataKey="RMSE" fill="#40debb" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></Panel><Panel title="R² score comparison" subtitle="Higher is better; measures variance explained"><div className="chart-wrap tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{top:12,right:12,left:0,bottom:8}}><CartesianGrid strokeDasharray="3 3" stroke="#2b3042" vertical={false}/><XAxis dataKey="name" stroke="#858ba4" tickLine={false} axisLine={false} fontSize={11}/><YAxis domain={[0,1]} stroke="#858ba4" tickLine={false} axisLine={false} fontSize={11}/><Tooltip contentStyle={{background:'#171c2e',border:'1px solid #34394a',borderRadius:10,color:'#e5e7f5'}} formatter={v=>Number(v).toFixed(4)}/><Bar dataKey="R2" name="R² score" fill="#40debb" radius={[6,6,0,0]} barSize={50}/></BarChart></ResponsiveContainer></div><div className="info-strip"><Activity size={16}/><span>Scores around 0.36 indicate the current models explain a limited share of salary variation. There is room to improve features and validation.</span></div></Panel></div><Panel title="Metrics table" subtitle="Loaded from /models/metrics when available"><div className="table-scroll"><table><thead><tr><th>Model</th><th>MAE (USD)</th><th>RMSE (USD)</th><th>R²</th><th>Interpretation</th></tr></thead><tbody>{metrics.map(m=><tr key={m.model}><td><b>{m.model}</b></td><td>{currency(m.MAE_USD)}</td><td>{currency(m.RMSE_USD)}</td><td>{Number.isFinite(m.R2)?m.R2.toFixed(4):'—'}</td><td><span className="pill pill-neutral">{m.MAE_USD===Math.min(...metrics.map(x=>x.MAE_USD))?'Lowest MAE':'Comparison'}</span></td></tr>)}</tbody></table></div></Panel></>;
}
function Performance({metrics}) {
 const [showMeaning,setShowMeaning]=useState(true); const best=[...metrics].sort((a,b)=>a.MAE_USD-b.MAE_USD)[0];
 return <><PageHeading eyebrow="MODEL EVALUATION" title="Model Performance" subtitle="Review the measured quality of the trained regressors—without inflated accuracy claims." action={<span className="pill pill-good"><Check size={13}/> Evaluation loaded</span>}/><div className="stat-grid"><StatCard label="Best MAE" value={currency(best.MAE_USD)} hint="Mean absolute error" icon={Gauge} tone="purple"/><StatCard label="Best RMSE" value={currency(best.RMSE_USD)} hint="Root mean squared error" icon={Activity} tone="teal"/><StatCard label="Best R²" value={Number.isFinite(best.R2)?best.R2.toFixed(4):'Not supplied'} hint="Coefficient of determination" icon={Network} tone="amber"/><StatCard label="Selected model" value={best.model} hint="Lowest MAE in current evaluation" icon={Cpu} tone="purple"/></div><Panel title="Evaluation results" subtitle="Metrics from the saved model comparison report"><div className="table-scroll"><table><thead><tr><th>Model</th><th>MAE</th><th>RMSE</th><th>R²</th><th>Summary</th></tr></thead><tbody>{metrics.map(m=><tr key={m.model}><td><span className="model-name"><span className={`model-dot ${m.model===best.model?'dot-teal':'dot-purple'}`}/>{m.model}</span></td><td>{currency(m.MAE_USD)}</td><td>{currency(m.RMSE_USD)}</td><td>{Number.isFinite(m.R2)?m.R2.toFixed(4):'—'}</td><td>{m.model===best.model?<span className="pill pill-good">Best by MAE</span>:<span className="pill pill-neutral">Baseline</span>}</td></tr>)}</tbody></table></div></Panel><Panel title="What do these metrics mean?" subtitle="Quick guide to interpreting regression evaluation"><button className="collapse-toggle" onClick={()=>setShowMeaning(v=>!v)}>{showMeaning?'Hide explanations':'Show explanations'} <ChevronDown size={15} className={showMeaning?'rotated':''}/></button>{showMeaning&&<div className="metric-explain"><div><span className="explain-symbol purple">MAE</span><h3>Mean Absolute Error</h3><p>Average absolute gap between a prediction and the observed salary. Lower is better. A $39k MAE means typical absolute errors are substantial.</p></div><div><span className="explain-symbol teal">RMSE</span><h3>Root Mean Squared Error</h3><p>Like MAE, but gives larger mistakes more weight. Lower is better; RMSE is usually at least as large as MAE.</p></div><div><span className="explain-symbol amber">R²</span><h3>Coefficient of determination</h3><p>How much outcome variation is explained by the model on the evaluation data. Near 1 is strong; near 0 is weak. It is not classification accuracy.</p></div></div>}</Panel><div className="notice"><ShieldCheck size={18}/><div><b>Improvement opportunity</b><p>Try more informative features, cross-validation, target/log transformation, hyperparameter tuning, and checking salary outliers. Compare all experiments on a held-out test set.</p></div></div></>;
}
function About({apiStatus}) { return <><PageHeading eyebrow="PROJECT NOTES" title="About SalaryIQ" subtitle="A student-built machine-learning application for exploring salary estimates from historical job data."/><div className="about-hero"><div className="about-logo"><TrendingUp size={31}/></div><div><div className="eyebrow">SALARYIQ · CAREER INTELLIGENCE</div><h2>From professional profile to salary estimate.</h2><p>SalaryIQ combines a Python machine-learning backend with a React dashboard so users can explore salary predictions, compare models, and understand their limitations.</p></div></div><div className="about-grid"><Panel title="Technology stack"><div className="stack-list">{[['Frontend','React + Vite'],['Charts','Recharts'],['API client','Axios'],['Backend','Python + Flask'],['Machine learning','Scikit-learn'],['Model artifacts','Joblib']].map(([a,b])=><div className="stack-row" key={a}><span>{a}</span><b>{b}</b></div>)}</div></Panel><Panel title="Service status"><div className="service-status"><span className={`service-icon ${apiStatus==='online'?'service-ok':'service-warn'}`}>{apiStatus==='online'?<Check size={20}/>:<Activity size={20}/>}</span><div><h3>Flask API {apiStatus==='online'?'reachable':'not confirmed'}</h3><p>Base URL: {API}</p><p>Health check: GET /health</p></div></div><div className="info-strip"><CircleHelp size={16}/><span>If your backend uses a different port, set <code>VITE_API_URL</code> in a frontend <code>.env</code> file and restart Vite.</span></div></Panel></div><Panel title="Dataset & limitations"><div className="limitations"><p>The current model was trained on historical international data-science salary records. It predicts in USD and uses work year, experience level, employment type, job title, employee residence, remote ratio, company location and company size.</p><p>The dataset does not directly include education level or an explicit skills list, so those fields are not part of this predictor. Estimates can be affected by location mix, outliers, changes in the job market and limited model performance.</p></div></Panel></>; }

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
