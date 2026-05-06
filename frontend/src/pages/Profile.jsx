import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile } from "../services/profileService";
import "./Profile.css";

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loadState, setLoadState] = useState("loading");
    const [loadError, setLoadError] = useState("");
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [message, setMessage] = useState("");
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoadState("loading");
        setLoadError("");

        getMyProfile()
            .then((data) => {
                if (cancelled) return;
                setProfile(data);
                setForm({
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.user?.email,
                    phone: data.user?.phone || "",
                    profilePicture: data.user?.profilePicture || null,
                });
                if (data.user?.profilePicture) {
                    setImagePreview(data.user.profilePicture);
                }
                setLoadState("ready");
            })
            .catch((err) => {
                if (cancelled) return;
                setLoadError(err?.message || "Неуспешно вчитување на профилот.");
                setLoadState("error");
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
            setForm({ ...form, profilePicture: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        try {
            const updated = await updateMyProfile(form);
            setProfile(updated);
            setForm({
                first_name: updated.first_name,
                last_name: updated.last_name,
                email: updated.user?.email,
                phone: updated.user?.phone || "",
                profilePicture: updated.user?.profilePicture || null,
            });
            setEditing(false);
            setMessage("Профилот е успешно ажуриран!");
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            setMessage("Грешка при зачувување!");
            setTimeout(() => setMessage(""), 3000);
        }
    };

    if (loadState === "loading") {
        return <p className="profile__status">Се вчитува...</p>;
    }

    if (loadState === "error") {
        return (
            <div className="profile profile--status">
                <div className="profile__card profile__card--message">
                    <p className="profile__error-text">{loadError}</p>
                    <p className="profile__hint">
                        Провери дали backend работи на <code>http://localhost:8080</code>, дали си најавен и дали
                        корисникот има поврзан запис за вработен во базата.
                    </p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return <p className="profile__status">Нема податоци за профилот.</p>;
    }

    return (
        <div className="profile">
            <div className="profile__card">
                <h2 className="profile__titlebar">Мој профил</h2>
                <div className="profile__body">
                    {message && <div className="profile__success">{message}</div>}

                    <div className="profile__avatar-section">
                        <div className="profile__avatar">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Профил" className="profile__avatar-img" />
                            ) : (
                                <div className="profile__avatar-placeholder">
                                    {profile.first_name?.[0]}{profile.last_name?.[0]}
                                </div>
                            )}
                        </div>
                        {editing && (
                            <label className="profile__upload-btn">
                                Промени слика
                                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                            </label>
                        )}
                    </div>

                    {[
                        { key: "first_name", label: "Име" },
                        { key: "last_name", label: "Презиме" },
                        { key: "email", label: "Е-пошта" },
                        { key: "phone", label: "Телефон" },
                    ].map(({ key, label }) => (
                        <div key={key} className="profile__field">
                            <span className="profile__label">{label}</span>
                            {editing ? (
                                <input className="profile__input" name={key} value={form[key]} onChange={handleChange} />
                            ) : (
                                <p className="profile__value">
                                    {key === "email" ? profile.user?.email :
                                        key === "phone" ? (profile.user?.phone || "—") :
                                            profile[key]}
                                </p>
                            )}
                        </div>
                    ))}

                    {[
                        { key: "department", label: "Оддел" },
                        { key: "position", label: "Позиција" },
                        { key: "employment_date", label: "Датум на вработување" },
                    ].map(({ key, label }) => (
                        <div key={key} className="profile__field">
                            <span className="profile__label">{label}</span>
                            <p className="profile__value profile__value--readonly">{profile[key]}</p>
                        </div>
                    ))}

                    <div className="profile__actions">
                        {editing ? (
                            <>
                                <button className="profile__btn profile__btn--primary" onClick={handleSave}>Зачувај</button>
                                <button className="profile__btn profile__btn--outline" onClick={() => setEditing(false)}>Откажи</button>
                            </>
                        ) : (
                            <button className="profile__btn profile__btn--primary" onClick={() => setEditing(true)}>Уреди профил</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}