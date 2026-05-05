const defaultProps = {
  size: 22,
  className: "",
  "aria-hidden": true,
};

function wrapSvg(children, { size, className, title, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Куќа — контролна табла */
export function IconHome(props) {
  const p = { ...defaultProps, ...props };
  return wrapSvg(
    <>
      <path
        d="M3 11.5 12 4l9 7.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M9 21V12h6v9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill="none"
      />
    </>,
    p
  );
}

/** Лична карта / евиденција */
export function IconIdCard(props) {
  const p = { ...defaultProps, ...props };
  return wrapSvg(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="9" cy="11" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 17c1-2 2.5-3 3-3h0c.5 0 2 1 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 9h4M14 12h4M14 15h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>,
    p
  );
}

export function IconCalendar(props) {
  const p = { ...defaultProps, ...props };
  return wrapSvg(
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M4 9.5h16" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9 3.5v3M15 3.5v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>,
    p
  );
}

export function IconLock(props) {
  const p = { ...defaultProps, ...props };
  return wrapSvg(
    <>
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <rect x="6" y="11" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="15.5" r="1.25" fill="currentColor" />
    </>,
    p
  );
}

/** Камера — скенирање лице */
export function IconCamera(props) {
  const p = { ...defaultProps, ...props };
  return wrapSvg(
    <>
      <path
        d="M4 9h2.2l1.4-2.2h8.8l1.4 2.2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="14" r="3.25" stroke="currentColor" strokeWidth="1.65" fill="none" />
    </>,
    p
  );
}

/** Три вработени во ред */
export function IconUsers(props) {
  const p = { ...defaultProps, ...props };
  const bust = (x) => (
    <g key={x} transform={`translate(${x} 12)`}>
      <circle cy="-2" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path
        d="M-2.5 6.5c0-1.2 1-2.2 2.5-2.2s2.5 1 2.5 2.2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
  return wrapSvg(<>{bust(6)}{bust(12)}{bust(18)}</>, p);
}

export function IconCsv(props) {
  const p = { ...defaultProps, ...props };
  return wrapSvg(
    <>
      <path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <text
        x="12"
        y="17.5"
        textAnchor="middle"
        fill="currentColor"
        fontSize="6"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        CSV
      </text>
    </>,
    p
  );
}

export function IconLogout(props) {
  const p = { ...defaultProps, ...props };
  return wrapSvg(
    <>
      <path
        d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 12h6M18 9l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
    p
  );
}

export function IconUserCircle(props) {
  const p = { ...defaultProps, ...props };
  return wrapSvg(
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M6.5 18.5c1.2-2.5 3.5-4 5.5-4s4.3 1.5 5.5 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </>,
    p
  );
}
export function IconEdit(props) {
    const p = { ...defaultProps, ...props };
    return wrapSvg(
        <>
            <path
                d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M17.5 2.5a2 2 0 0 1 2.83 2.83L12 13.5l-4 1 1-4 8.5-8z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </>,
        p
    );
}

const iconMap = {
  home: IconHome,
  idcard: IconIdCard,
  calendar: IconCalendar,
  lock: IconLock,
  users: IconUsers,
  csv: IconCsv,
  user: IconUserCircle,
  edit: IconEdit
};

export function NavIcon({ name, ...rest }) {
  const Cmp = iconMap[name];
  if (!Cmp) return null;
  return <Cmp {...rest} />;
}
