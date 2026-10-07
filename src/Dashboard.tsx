import { useState } from "react";
import type { FormEvent } from "react";
export type Role = "user" | "admin" | "master_admin";
export type Account = {
    name: string;
    email: string;
    role: Role;
};
type Item = {
    id: number;
    title: string;
    category: string;
    owner: string;
    status: "Available" | "Donated";
};
type User = {
    id: number;
    name: string;
    email: string;
    role: Role;
};
type Request = {
    id: number;
    item: string;
    name: string;
    status: string;
};
type Report = {
    id: number;
    itemId: number;
    reason: string;
    status: string;
};
type Props = {
    account: Account;
    onLogout: () => void;
};
const sampleItems: Item[] = [
    { id: 1, title: "Study desk", category: "Furniture", owner: "Neighbour", status: "Available" },
    { id: 2, title: "Winter jacket", category: "Clothing", owner: "Demo User", status: "Available" },
    { id: 3, title: "Web development books", category: "Books", owner: "Neighbour", status: "Available" },
    { id: 4, title: "Kitchen plates", category: "Home", owner: "Demo User", status: "Donated" },
];
export default function Dashboard({ account, onLogout }: Props) {
    const isAdmin = account.role !== "user";
    const isMaster = account.role === "master_admin";
    const tabs = isAdmin
        ? ["Overview", "Listings", "Users", "Reports"]
        : ["Browse", "Post item", "My listings", "Requests", "Profile"];
    const [tab, setTab] = useState(tabs[0]);
    const [items, setItems] = useState<Item[]>(sampleItems);
    const [users, setUsers] = useState<User[]>([
        { id: 1, name: "Demo User", email: "user@example.com", role: "user" },
        { id: 2, name: "Aman", email: "aman@example.com", role: "user" },
        { id: 3, name: "Demo Admin", email: "admin@example.com", role: "admin" },
        { id: 4, name: "Master Admin", email: "master@example.com", role: "master_admin" },
    ]);
    const [requests, setRequests] = useState<Request[]>([
        { id: 1, item: "Winter jacket", name: "Aman", status: "Pending" },
    ]);
    const [reports, setReports] = useState<Report[]>([
        { id: 1, itemId: 1, reason: "Pickup location needs clarification", status: "Open" },
    ]);
    const [search, setSearch] = useState("");
    const [name, setName] = useState(account.name);
    const [notice, setNotice] = useState("");
    // Sample ownership uses the original demo name so profile edits don't hide listings.
    const myItems = items.filter((item) => item.owner === "Demo User");
    const visibleItems = items.filter((item) => item.status === "Available" &&
        `${item.title} ${item.category}`.toLowerCase().includes(search.toLowerCase()));
    // Switch dashboard sections and clear the previous action message.
    function changeTab(nextTab: string) {
        setTab(nextTab);
        setNotice("");
    }
    // Add a sample listing. A real app would save this through the backend.
    function postItem(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const title = String(form.get("title") ?? "").trim();
        if (!title) {
            setNotice("Please enter an item title.");
            return;
        }
        setItems((current) => [...current, {
                id: Date.now(), title, category: String(form.get("category")),
                owner: "Demo User", status: "Available",
            }]);
        event.currentTarget.reset();
        setTab("My listings");
        setNotice("Your sample listing was added.");
    }
    // Keep one pending request per item in this demo.
    function requestItem(item: Item) {
        if (requests.some((request) => request.item === item.title && request.name === "Demo User")) {
            setNotice("You already requested this item.");
            return;
        }
        setRequests((current) => [...current, {
                id: Date.now(), item: item.title, name: "Demo User", status: "Pending",
            }]);
        setNotice(`Your sample request for ${item.title} was added.`);
    }
    // Mark your item as donated so it no longer appears in Browse.
    function markDonated(id: number) {
        setItems((current) => current.map((item) => item.id === id ? { ...item, status: "Donated" } : item));
        setNotice("Item marked as donated in this preview.");
    }
    // Ask before removing a listing to avoid accidental clicks.
    function removeItem(id: number) {
        if (!window.confirm("Remove this sample listing?"))
            return;
        setItems((current) => current.filter((item) => item.id !== id));
        setNotice("Sample listing removed.");
    }
    // Update the displayed request status without contacting another person.
    function updateRequest(id: number, status: string) {
        setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
        setNotice("Sample request updated.");
    }
    // Only the master admin gets appointment controls in this preview.
    // The real backend must enforce this rule for every role-change request.
    function changeRole(id: number, role: Role) {
        if (!isMaster)
            return;
        setUsers((current) => current.map((user) => user.id === id && user.role !== "master_admin" ? { ...user, role } : user));
        setNotice("Sample account role updated.");
    }
    // Keep the master admin account protected in this sample list.
    function removeUser(user: User) {
        if (user.role !== "user" && !isMaster)
            return;
        if (user.role === "master_admin" || !window.confirm(`Remove ${user.name} from the sample list?`))
            return;
        setUsers((current) => current.filter((entry) => entry.id !== user.id));
        setNotice("Sample user removed.");
    }
    // Resolve a report once an admin has reviewed it.
    function resolveReport(id: number) {
        setReports((current) => current.map((report) => report.id === id ? { ...report, status: "Resolved" } : report));
        setNotice("Sample report resolved.");
    }
    // Save a name for this preview only. Reloading restores the sample data.
    function saveProfile(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const nextName = String(form.get("name") ?? "").trim();
        if (!nextName) {
            setNotice("Please enter your name.");
            return;
        }
        setName(nextName);
        setNotice("Your name was updated for this preview.");
    }
    return (<main className="dashboard">
      <header className="top-bar">
        <span className="dashboard-logo">Freebee4me</span>
        <button className="small-button" onClick={onLogout}>Sign out</button>
      </header>
      <section className="dashboard-body">
        <p className="tagline">{isMaster ? "MASTER ADMIN" : isAdmin ? "ADMIN" : "YOUR COMMUNITY"}</p>
        <h1>Hello, {name}</h1>
        <p className="description">{isAdmin ? "Manage your community and its listings." : "Find something useful or share an item you no longer need."}</p>
        <p className="notice">Demo only. Actions change sample data in memory and reset when you sign out or reload. No real authentication is active.</p>
        <nav className="menu" aria-label="Dashboard sections">
          {tabs.map((label) => <button key={label} aria-current={tab === label ? "page" : undefined} onClick={() => changeTab(label)}>{label}</button>)}
        </nav>
        {notice && <p className="notice" role="status">{notice}</p>}
        <h2>{tab}</h2>

        {tab === "Overview" && (<div className="cards">
            <article className="card"><h3>Users</h3><p className="number">{users.length}</p></article>
            <article className="card"><h3>Available items</h3><p className="number">{items.filter((item) => item.status === "Available").length}</p></article>
            <article className="card"><h3>Donated items</h3><p className="number">{items.filter((item) => item.status === "Donated").length}</p></article>
            <article className="card"><h3>Open reports</h3><p className="number">{reports.filter((report) => report.status === "Open").length}</p></article>
          </div>)}

        {tab === "Browse" && <div className="field search"><label htmlFor="search">Search items</label><input id="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title or category"/></div>}

        {["Browse", "My listings", "Listings"].includes(tab) && (<div className="cards">
            {(tab === "Browse" ? visibleItems : tab === "My listings" ? myItems : items).map((item) => (<article className="card" key={item.id}>
                <p className="tagline">{item.category}</p><h3>{item.title}</h3>
                <p>{item.owner} · {item.status}</p>
                <div className="actions">
                  {tab === "Browse" && item.owner !== "Demo User" && <button className="small-button" onClick={() => requestItem(item)}>Request item</button>}
                  {tab === "My listings" && item.status === "Available" && <button className="small-button" onClick={() => markDonated(item.id)}>Mark donated</button>}
                  {tab !== "Browse" && <button className="small-button danger" onClick={() => removeItem(item.id)}>Remove</button>}
                </div>
              </article>))}
            {(tab === "Browse" ? visibleItems : tab === "My listings" ? myItems : items).length === 0 && <p>No items to display.</p>}
          </div>)}

        {tab === "Post item" && (<form className="panel" onSubmit={postItem}>
            <div className="field"><label htmlFor="item-title">Item title</label><input id="item-title" name="title" maxLength={100} required placeholder="What would you like to give away?"/></div>
            <div className="field"><label htmlFor="category">Category</label><select id="category" name="category"><option>Furniture</option><option>Clothing</option><option>Books</option><option>Home</option><option>Other</option></select></div>
            <button className="submit-button" type="submit">Post sample item</button>
          </form>)}

        {tab === "Requests" && (<div className="cards">
            {requests.map((request) => <article className="card" key={request.id}>
              <p className="tagline">{request.name === "Demo User" ? "YOUR REQUEST" : "INCOMING REQUEST"}</p>
              <h3>{request.item}</h3><p>{request.name} · {request.status}</p>
              {request.status === "Pending" && <div className="actions">
                {request.name === "Demo User"
                        ? <button className="small-button" onClick={() => updateRequest(request.id, "Cancelled")}>Cancel request</button>
                        : <><button className="small-button" onClick={() => updateRequest(request.id, "Accepted")}>Accept</button><button className="small-button" onClick={() => updateRequest(request.id, "Declined")}>Decline</button></>}
              </div>}
            </article>)}
          </div>)}

        {tab === "Profile" && (<form className="panel" onSubmit={saveProfile}>
            <div className="field"><label htmlFor="profile-name">Full name</label><input id="profile-name" name="name" defaultValue={name} maxLength={100} required/></div>
            <div className="field"><label htmlFor="profile-email">Email address</label><input id="profile-email" value={account.email} readOnly/></div>
            <button className="submit-button" type="submit">Save sample profile</button>
          </form>)}

        {tab === "Users" && (<>
            {isMaster && <p className="description">Appoint an existing sample user as an admin, or remove their admin access.</p>}
            <div className="cards">{users.map((user) => <article className="card" key={user.id}>
              <h3>{user.name}</h3><p>{user.email}</p><p>Role: {user.role.replace("_", " ")}</p>
              <div className="actions">
                {isMaster && user.role === "user" && <button className="small-button" onClick={() => changeRole(user.id, "admin")}>Appoint admin</button>}
                {isMaster && user.role === "admin" && <button className="small-button" onClick={() => changeRole(user.id, "user")}>Remove admin access</button>}
                {user.role !== "master_admin" && (isMaster || user.role === "user") && <button className="small-button danger" onClick={() => removeUser(user)}>Remove user</button>}
              </div>
            </article>)}</div>
          </>)}

        {tab === "Reports" && (<div className="cards">{reports.map((report) => <article className="card" key={report.id}>
            <h3>{items.find((item) => item.id === report.itemId)?.title ?? "Removed listing"}</h3>
            <p>{report.reason}</p><p>Status: {report.status}</p>
            {report.status === "Open" && <button className="small-button" onClick={() => resolveReport(report.id)}>Mark resolved</button>}
          </article>)}</div>)}
      </section>
    </main>);
}
