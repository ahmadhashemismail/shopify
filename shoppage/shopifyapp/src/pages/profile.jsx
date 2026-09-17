import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createaccount, login } from '../api'


export default function Profile() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [mode, setMode] = useState('create')
  const [Loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handlelogin(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await login(form)
      if (res.error) {
        setError(res.error);
      } else {
        setCustomer(res)
        localStorage.setItem("account", JSON.stringify(res));
        setMode("customer");
      }
    }
    catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handlecreateaccount(e) {
    e.preventDefault()
    setError("")

    if (registerForm.password !== registerForm.confirm) {
      setError("incorrect password");
      return;
    }
    setLoading(true);
    try {
      const res = await createaccount({
        full_name: registerForm.full_name,
        email: registerForm.email,
        password: registerForm.password,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setMode("customer");
        setError("");
        setForm({ email: registerForm.email, password: "" })
      }
    }
    catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("account")
    return saved ? JSON.parse(saved) : null
  })
  if (customer) {
    return (
      <main className="profile-page">
        <div className="profile-shell profile-shell-member">
          <section className="profile-brand">
            <Link className="profile-wordmark" to="/">jumble<span>.</span></Link>
            <div className="profile-brand-copy">
              <p className="eyebrow">A little bit of everything</p>
              <h1>Good taste <br /><em>lives here.</em></h1>
            </div>
            <div className="profile-shape profile-shape-lime" />
            <div className="profile-shape profile-shape-pink" />
            <span className="profile-sticker">member club ★</span>
          </section>
          <section className="customer-profile">
            <Link className="back-link" to="/">← Back to shop</Link>
            <div className="profile-heading">
              <div className="customer-avatar">{(customer.name || customer.full_name || customer.email || '?')[0].toUpperCase()}</div>
              <div>
                <p className="eyebrow">Your jumble account</p>
                <h2>Hi, {customer.name || customer.full_name || 'there'}.</h2>
              </div>
            </div>
            <p className="profile-email">{customer.email}</p>
            <div className="profile-card">
              <span>Account details</span>
              <strong>{customer.name || customer.full_name || 'Unnamed customer'}</strong>
              <strong>{customer.email}</strong>
            </div>
            <div className="profile-stats">
              <div><strong>0</strong><span>Orders</span></div>
              <div><strong>0</strong><span>Saved picks</span></div>
              <div><strong>15%</strong><span>Welcome perk</span></div>
            </div>
            <p className="profile-note">Your next oddly specific find is waiting.</p>
            <div className="profile-actions">
              <Link className="primary-button" to="/">Continue shopping</Link>
              <button className="secondary-button" type="button" onClick={() => {
                localStorage.removeItem("account")
                setCustomer(null)
              }}>Sign out</button>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="profile-page">
      <div className="profile-shell">
        <section className="profile-brand">
          <Link className="profile-wordmark" to="/">jumble<span>.</span></Link>
          <div className="profile-brand-copy">
            <p className="eyebrow">Welcome to the weird side</p>
            <h1>Find your<br /><em>new favorite.</em></h1>
            <p>Keep your details close and your taste delightfully unpredictable.</p>
          </div>
          <div className="profile-shape profile-shape-lime" />
          <div className="profile-shape profile-shape-pink" />
          <span className="profile-sticker">good stuff inside ★</span>
        </section>
        <section className="account-panel">
          <Link className="back-link" to="/">← Back to shop</Link>
          <p className="eyebrow">Your account</p>
          <h2>{mode === 'create' ? <>Join the<br />jumble.</> : <>Welcome<br />back.</>}</h2>
          <p className="header-copy">{mode === 'create' ? 'Create an account and keep your oddly specific finds in one place.' : 'Sign in to pick up where you left off.'}</p>

          <div className="account-tabs" role="tablist" aria-label="Account actions">
            <button className={mode === 'create' ? 'active' : ''} type="button" role="tab" aria-selected={mode === 'create'} onClick={() => setMode('create')}>Create account</button>
            <button className={mode === 'signin' ? 'active' : ''} type="button" role="tab" aria-selected={mode === 'signin'} onClick={() => setMode('signin')}>Sign in</button>
          </div>

          <form className="account-form" onSubmit={mode === 'create' ? handlecreateaccount : handlelogin}>
            {mode === 'create' && (
              <>
                <label htmlFor="full_name">Name</label>
                <input id="full_name" name="full_name" value={registerForm.full_name} onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })} placeholder="Your name" required />
              </>
            )}

            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={mode === 'create' ? registerForm.email : form.email} onChange={(e) => mode === 'create' ? setRegisterForm({ ...registerForm, email: e.target.value }) : setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />

            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={mode === 'create' ? registerForm.password : form.password} onChange={(e) => mode === 'create' ? setRegisterForm({ ...registerForm, password: e.target.value }) : setForm({ ...form, password: e.target.value })} placeholder="Your password" required />

            {mode === 'create' && (
              <>
                <label htmlFor="confirm">Confirm password</label>
                <input id="confirm" name="confirm" type="password" value={registerForm.confirm} onChange={(e) => setRegisterForm({ ...registerForm, confirm: e.target.value })} placeholder="Repeat your password" required />
              </>
            )}

            {error && <p className="profile-error" role="alert">{error}</p>}

            <button className="primary-button account-submit" type="submit" disabled={Loading}>
              {mode === 'create' ? 'Create account →' : 'Sign in →'}
            </button>
          </form>
          <p className="account-footnote">By continuing, you agree to our very reasonable terms.</p>
        </section>
      </div>
    </main>
  )
}
