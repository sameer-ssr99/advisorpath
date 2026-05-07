import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

export default function StudentSettings() {
  const rows = [
    ['Email Notifications', 'Receive emails about announcements and advising', 'Manage'],
    ['Password', 'Last changed 3 months ago', 'Change'],
    ['Two-Factor Authentication', 'Add an extra layer of security', 'Enable'],
    ['Data & Privacy', 'Manage how your information is used', 'View'],
  ];

  return (
    <div className="app-shell"><Sidebar /><section className="content-shell"><Navbar /><main className="page-pad">
      <section className="panel-card">
        <h1 className="section-title">Account Settings</h1>
        <p className="section-subtitle">Manage your account preferences</p>
        <div className="divide-y divide-slate-200 mt-3">
          {rows.map(([title, subtitle, action]) => (
            <div key={title} className="py-4 flex items-center justify-between gap-3">
              <div><h3 className="text-2xl font-semibold">{title}</h3><p className="text-slate-500">{subtitle}</p></div>
              <button className="secondary-btn">{action}</button>
            </div>
          ))}
        </div>
      </section>
    </main></section></div>
  );
}
