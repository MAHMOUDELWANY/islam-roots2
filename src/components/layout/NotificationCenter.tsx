import React, { useState } from "react";
import { Bell, Check, Trash2, Calendar, BookOpen, ShieldAlert, X } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useLanguage } from "../../context/LanguageContext";

interface NotificationCenterProps {
  onOpenSchedule?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onOpenSchedule }) => {
  const { notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useData();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-[#E8E5DB]/70 dark:bg-[#232B23] border border-[#D4D1C5]/60 dark:border-[#2A352A] text-[#3E4D3E] dark:text-stone-200 hover:bg-[#E8E5DB] transition-all cursor-pointer"
        title={t("notifications")}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 rtl:-left-1 rtl:right-auto flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#1C221C] border border-[#E8E5DB] dark:border-[#2A352A] shadow-xl py-3 z-50 text-xs text-[#1F261F] dark:text-[#E2E8E2]">
          {/* Header */}
          <div className="px-4 pb-3 border-b border-[#E8E5DB] dark:border-[#2A352A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#5A6B5A] dark:text-[#8BA888]" />
              <span className="font-serif font-bold text-sm text-[#1F261F] dark:text-stone-100">{t("notifications")}</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold text-[10px]">
                  {unreadCount} {t("unreadNotifications")}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-[#7A7D75] hover:bg-[#E8E5DB] dark:hover:bg-[#2A352A] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Actions Subbar */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-[#FCFAF5] dark:bg-[#161D17] border-b border-[#E8E5DB] dark:border-[#2A352A] flex items-center justify-between text-[11px]">
              <button
                onClick={() => markAllNotificationsRead()}
                className="flex items-center gap-1 text-[#5A6B5A] dark:text-[#8BA888] font-medium hover:underline cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>{t("markAllRead")}</span>
              </button>
              <button
                onClick={() => clearNotifications()}
                className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium hover:underline cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>{t("clearAll")}</span>
              </button>
            </div>
          )}

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#E8E5DB]/60 dark:divide-[#2A352A]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[#7A7D75] dark:text-stone-400">
                <p className="font-medium">{t("noNotifications")}</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationRead(notif.id);
                    if (onOpenSchedule) onOpenSchedule();
                    setIsOpen(false);
                  }}
                  className={`p-3.5 flex items-start gap-3 hover:bg-[#FCFAF5] dark:hover:bg-[#232B23] transition-colors cursor-pointer ${
                    !notif.read ? "bg-amber-50/40 dark:bg-amber-950/20 font-medium" : ""
                  }`}
                >
                  <div className="p-2 rounded-lg bg-[#E8E5DB] dark:bg-[#2A352A] text-[#5A6B5A] dark:text-[#8BA888] shrink-0 mt-0.5">
                    {notif.type === "reminder" ? (
                      <Calendar className="w-4 h-4" />
                    ) : notif.type === "session" ? (
                      <BookOpen className="w-4 h-4" />
                    ) : (
                      <ShieldAlert className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-[#1F261F] dark:text-stone-100 text-xs truncate">{notif.title}</p>
                      <span className="text-[10px] text-[#7A7D75] dark:text-stone-400 shrink-0">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[#4A504A] dark:text-stone-300 text-xs mt-0.5 line-clamp-2">{notif.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
