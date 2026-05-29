// ============================================================
//  SettingsPage  –  Settings feature
// ============================================================

import React, { useState } from "react";
import { settingsService } from "../../core/services/SettingsService";
import { authService } from "../../core/services/AuthService";
import { useAppStore } from "../../core/providers/AppStore";
import { useToast } from "../../shared/hooks";
import { Button } from "../../shared/components/ui/Button/Button";
import styles from "./SettingsPage.module.css";

export const SettingsPage: React.FC = () => {
  const { farm, settings, setSettings, darkMode, toggleDark } = useAppStore(
    (s) => ({
      farm: s.farm,
      settings: s.settings,
      setSettings: s.setSettings,
      darkMode: s.darkMode,
      toggleDark: s.toggleDark,
    }),
  );
  const toast = useToast();

  const [appName, setAppName] = useState(
    settings?.app_name ?? "AG Lettuce Be Fresh",
  );
  const [threshold, setThreshold] = useState(
    settings?.low_stock_threshold ?? 15,
  );
  const [currency, setCurrency] = useState(settings?.currency ?? "PHP");
  const [newColName, setNewColName] = useState("");
  const [newPass, setNewPass] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSaveGeneral(e: React.FormEvent) {
    e.preventDefault();
    if (!farm) return;
    setSaving(true);
    const result = await settingsService.update(farm.id, {
      app_name: appName,
      low_stock_threshold: threshold,
      currency,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setSettings(result.data);
    toast.success("Settings saved!");
  }

  async function handleAddColumn() {
    if (!farm || !settings || !newColName.trim()) return;
    const result = await settingsService.addCustomColumn(
      farm.id,
      settings.custom_columns,
      newColName.trim(),
    );
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setSettings(result.data);
    setNewColName("");
    toast.success(`Column "${newColName}" added.`);
  }

  async function handleRemoveColumn(key: string) {
    if (!farm || !settings) return;
    const result = await settingsService.removeCustomColumn(
      farm.id,
      settings.custom_columns,
      key,
    );
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setSettings(result.data);
    toast.info("Column removed.");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPass) return;
    const result = await authService.updatePassword(newPass);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Password updated.");
    setNewPass("");
  }

  return (
    <section className={styles.page} data-testid="settings-page">
      {/* General Settings */}
      <div className={styles.card} data-testid="general-settings">
        <h3 className={styles.cardTitle}>
          <i className="fa-solid fa-sliders" /> General Settings
        </h3>
        <form onSubmit={handleSaveGeneral}>
          <div className={styles.formGroup}>
            <label>App Name</label>
            <input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="AG Lettuce Be Fresh"
              data-testid="setting-app-name"
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Low Stock Threshold</label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(+e.target.value)}
                min={0}
                data-testid="setting-threshold"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Currency Code</label>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="PHP"
                data-testid="setting-currency"
              />
            </div>
          </div>
          <Button type="submit" loading={saving} data-testid="btn-save-general">
            Save Settings
          </Button>
        </form>
      </div>

      {/* Appearance */}
      <div className={styles.card} data-testid="appearance-settings">
        <h3 className={styles.cardTitle}>
          <i className="fa-solid fa-palette" /> Appearance
        </h3>
        <div className={styles.toggleRow}>
          <span>Dark Mode</span>
          <label className={styles.switch} data-testid="dark-mode-toggle">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={toggleDark}
              aria-label="Toggle dark mode"
            />
            <span className={styles.slider} />
          </label>
        </div>
      </div>

      {/* Custom Columns */}
      <div className={styles.card} data-testid="custom-columns-settings">
        <h3 className={styles.cardTitle}>
          <i className="fa-solid fa-table-columns" /> Custom Inventory Columns
        </h3>
        <p className={styles.hint}>
          Add extra columns to your inventory table.
        </p>

        {(settings?.custom_columns ?? []).map((col) => (
          <div
            className={styles.columnChip}
            key={col.key}
            data-testid={`custom-col-${col.key}`}
          >
            <span>{col.name}</span>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleRemoveColumn(col.key)}
              data-testid={`remove-col-${col.key}`}
            >
              <i className="fa-solid fa-xmark" />
            </Button>
          </div>
        ))}

        <div className={styles.addColRow}>
          <input
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleAddColumn())
            }
            placeholder="Column name…"
            data-testid="new-column-name"
          />
          <Button
            variant="success"
            size="sm"
            onClick={handleAddColumn}
            data-testid="btn-add-column"
          >
            <i className="fa-solid fa-plus" /> Add
          </Button>
        </div>
      </div>

      {/* Security */}
      <div className={styles.card} data-testid="security-settings">
        <h3 className={styles.cardTitle}>
          <i className="fa-solid fa-shield-halved" /> Security
        </h3>
        <form onSubmit={handleChangePassword}>
          <div className={styles.formGroup}>
            <label>New Password</label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              data-testid="new-password"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            data-testid="btn-change-password"
          >
            <i className="fa-solid fa-key" /> Change Password
          </Button>
        </form>
      </div>

      {/* Database Info */}
      <div className={styles.card} data-testid="database-info">
        <h3 className={styles.cardTitle}>
          <i className="fa-solid fa-database" /> Database Connection
        </h3>
        <div className={styles.dbInfo}>
          <span className={styles.dbBadge}>
            <i className="fa-solid fa-circle" style={{ color: "#40916c" }} />{" "}
            Supabase Connected
          </span>
          <p className={styles.hint}>
            Farm ID: <code>{farm?.id ?? "—"}</code>
          </p>
          <p className={styles.hint}>
            All data is stored in Supabase with Row Level Security (RLS)
            enabled.
          </p>
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;
