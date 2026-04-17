import { formatDate } from "../utils/formatDate.js";
import "./Page.css";

export default function Dashboard() {
  return (
    <div className="page">
      <p className="page__lead">
        Placeholder за контролна табла — статистики и последни записи ќе дојдат според спецификацијата.
      </p>
      <div className="page__cards">
        <article className="stat-card">
          <h3 className="stat-card__label">Денес</h3>
          <p className="stat-card__value">{formatDate(new Date())}</p>
        </article>
        <article className="stat-card">
          <h3 className="stat-card__label">Статус</h3>
          <p className="stat-card__value stat-card__value--ok">Во изработка</p>
        </article>
      </div>
    </div>
  );
}
