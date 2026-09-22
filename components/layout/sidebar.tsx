"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { NAV_SECTIONS } from "@/lib/rbac/navigation";
import { cn } from "@/lib/utils";

export function Sidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const { permissions, roles } = useAuth();

  const adminLikeRoles = ["super_admin", "direction", "administration", "scolarite", "comptabilite", "rh"];
  const isStudentOnly = roles.includes("etudiant") && !roles.some((r) => adminLikeRoles.includes(r));
  const isTeacherOnly = roles.includes("formateur") && !roles.some((r) => adminLikeRoles.includes(r));

  const canSeeItem = (itemPermissions?: string[]) => {
    if (!itemPermissions || itemPermissions.length === 0) return true;
    return itemPermissions.some((p) => permissions.includes(p as never));
  };

  const canSeeSection = (sectionLabel: string) => {
    if (isStudentOnly) return sectionLabel === "Principal" || sectionLabel === "Mon espace étudiant";
    if (isTeacherOnly) return sectionLabel === "Principal" || sectionLabel === "Mon espace formateur";
    return sectionLabel !== "Mon espace étudiant" && sectionLabel !== "Mon espace formateur";
  };

  return (
    <aside
      className={cn(
        "h-full bg-white text-slate-700 flex flex-col border-r border-slate-200/80 transition-all duration-200",
        collapsed ? "w-[76px]" : "w-[248px]"
      )}
    >
      <div className="flex items-center gap-3 px-5 h-[72px] border-b border-slate-100 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-[0_6px_16px_rgba(37,99,235,0.22)]">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-[15px] font-bold tracking-tight text-slate-900 truncate">
            Centre de Formation
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-5">
        {NAV_SECTIONS.filter((s) => canSeeSection(s.label)).map((section) => {
          const visibleItems = section.items.filter((item) => canSeeItem(item.permissions));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label} className="mb-6">
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em] mb-2">
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (pathname.startsWith(item.href + "/") && item.href !== "/dashboard");
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 text-[13px] rounded-xl transition-all duration-200",
                          isActive
                            ? "bg-blue-50 text-primary font-semibold shadow-sm"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                          collapsed && "justify-center"
                        )}
                      >
                        <Icon className="w-[17px] h-[17px] shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="mx-3 mb-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
        {!collapsed && (
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 mt-0.5 text-primary shrink-0" />
            <p className="text-[11px] leading-4 text-blue-900">Apprenez, progressez, atteignez vos objectifs.</p>
          </div>
        )}
      </div>
      <button
        onClick={onToggleCollapse}
        className="flex items-center justify-center h-12 border-t border-slate-100 text-slate-400 hover:text-slate-900 transition-colors shrink-0"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <>
            <ChevronLeft className="w-4 h-4 mr-2" />
            <span className="text-xs">Réduire</span>
          </>
        )}
      </button>
    </aside>
  );
}
