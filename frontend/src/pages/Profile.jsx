import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile } from "../services/profileService";
import "./Profile.css";

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [message, setMessage] = useState("");
<<<<<<< Updated upstream
=======
    const [imagePreview, setImagePreview] = useState(null);
>>>>>>> Stashed changes

    useEffect(() => {
        getMyProfile().then((data) => {
            setProfile(data);
            setForm({
                first_name: data.first_name,
                last_name: data.last_name,
<<<<<<< Updated upstream
                department: data.department,
                position: data.position,
            });
=======
                email: data.user?.email,
                phone: data.user?.phone || "",
                profilePicture: data.user?.profilePicture || null,
            });
            if (data.user?.profilePicture) {
                setImagePreview(data.user.profilePicture);
            }
>>>>>>> Stashed changes
        });
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

<<<<<<< Updated upstream
=======
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

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
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
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    style={{ display: "none" }}
                                />
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
                                <input
                                    className="profile__input"
                                    name={key}
                                    value={form[key]}
                                    onChange={handleChange}
                                />
                            ) : (
                                <p className="profile__value">
                                    {key === "email" ? profile.user?.email :
                                        key === "phone" ? (profile.user?.phone || "—") :
                                            profile[key]}
                                </p>
>>>>>>> Stashed changes
                            )}
                        </div>
                    ))}

<<<<<<< Updated upstream
                    <div className="profile__field">
                        <span className="profile__label">Датум на вработување</span>
                        <p className="profile__value">{profile.employment_date}</p>
                    </div>

                    <div className="profile__field">
                        <span className="profile__label">Е-пошта</span>
                        <p className="profile__value">{profile.user?.email}</p>
                    </div>
=======
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
>>>>>>> Stashed changes

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