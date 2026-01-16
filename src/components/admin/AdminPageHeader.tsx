import type { LucideIcon } from "lucide-react";
import React from "react";
import styles from "../pages/AdminBase.module.css";

interface AdminPageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

const AdminPageHeader = React.memo(function AdminPageHeader({ icon: Icon, title, subtitle }: AdminPageHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.titleGroup}>
        <div className={styles.titleRow}>
          <div className={styles.titleIcon}>
            <Icon size={20} color="white" />
          </div>
          <h1 className={styles.title}>{title}</h1>
        </div>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </div>
  );
});

export default AdminPageHeader;
