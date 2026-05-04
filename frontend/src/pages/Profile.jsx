import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile } from "../services/profileService";
import "./Profile.css";

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [message, setMessage] = useState("");

    useEffect(() => {
        getMyProfile().then((data) => {
            setProfile(data);
            setForm({
                first_name: data.first_name,
                last_name: data.last_name,
                department: data.department,
                position: data.position,
            });
        });
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        const updated = await updateMyProfile(form);
        setProfile(updated);
        setEditing(false);
        setMessage("Профилот е успешно ажуриран!");
        setTimeout(() => setMessage(""), 3000);
    };

    if (!profile) return <p>Се вчитува...</p>;

    return (
        <div className="profile">
            <div className="profile__card">
                <h2 className="profile__titlebar">Мој профил</h2>

                <div className="profile__body">
                    {message && <div className="profile__success">{message}</div>}

                    {["first_name", "last_name", "department", "position"].map((field) => (
                        <div key={field} className="profile__field">
              <span className="profile__label">
                {field === "first_name" ? "Име" :
                    field === "last_name" ? "Презиме" :
                        field === "department" ? "Оддел" : "Позиција"}
              </span>
                            {editing ? (
                                <input
                                    className="profile__input"
                                    name={field}
                                    value={form[field]}
                                    onChange={handleChange}
                                />
                            ) : (
                                <p className="profile__value">{profile[field]}</p>
                            )}
                        </div>
                    ))}

                    <div className="profile__field">
                        <span className="profile__label">Датум на вработување</span>
                        <p className="profile__value">{profile.employment_date}</p>
                    </div>

                    <div className="profile__field">
                        <span className="profile__label">Е-пошта</span>
                        <p className="profile__value">{profile.user?.email}</p>
                    </div>

                    <div className="profile__actions">
                        {editing ? (
                            <>
                                <button className="profile__btn profile__btn--primary" onClick={handleSave}>
                                    Зачувај
                                </button>
                                <button className="profile__btn profile__btn--outline" onClick={() => setEditing(false)}>
                                    Откажи
                                </button>
                            </>
                        ) : (
                            <button className="profile__btn profile__btn--primary" onClick={() => setEditing(true)}>
                                Уреди профил
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}