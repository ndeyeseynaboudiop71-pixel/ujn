"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { GraduationCap, Printer, ArrowLeft, Award } from "lucide-react";
import type { StudentBulletinData, BulletinContext } from "@/lib/academic/bulletin-engine";
import { getMention } from "@/lib/academic/bulletin-engine";

interface PrintableBulletinProps {
  bulletin: StudentBulletinData;
  context: BulletinContext;
  onBack?: () => void;
}

export function PrintableBulletin({ bulletin, context, onBack }: PrintableBulletinProps) {
  return (
    <div>
      {onBack && (
        <div className="flex items-center justify-between mb-4 no-print">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Imprimer / PDF
          </Button>
        </div>
      )}

      {!onBack && (
        <div className="flex justify-end mb-4 no-print">
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Imprimer / PDF
          </Button>
        </div>
      )}

      <Card className="p-6 sm:p-8 max-w-3xl mx-auto print:shadow-none print:border-0">
        <div className="text-center mb-6 border-b pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">
              {context.institution?.name ?? "Centre de Formation"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {context.institution?.address ?? ""}
          </p>
          <h2 className="text-lg font-bold mt-3 uppercase tracking-wide">Bulletin de Notes</h2>
          <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>Année académique : <strong className="text-foreground">{context.academicYear?.name ?? "—"}</strong></span>
            <span>Période : <strong className="text-foreground">{context.termLabel}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Formation</p>
            <p className="font-medium">{context.program?.name ?? context.course?.name ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Classe</p>
            <p className="font-medium">{context.classItem?.name ?? "—"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-lg bg-muted/50">
          <div>
            <p className="text-xs text-muted-foreground">Matricule</p>
            <p className="text-sm font-medium">{bulletin.student.student_number}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nom</p>
            <p className="text-sm font-medium">{bulletin.student.last_name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Prénom(s)</p>
            <p className="text-sm font-medium">{bulletin.student.first_name ?? "—"}</p>
          </div>
          {bulletin.student.birth_date && (
            <div>
              <p className="text-xs text-muted-foreground">Date de naissance</p>
              <p className="text-sm font-medium">
                {new Date(bulletin.student.birth_date).toLocaleDateString("fr-FR")}
              </p>
            </div>
          )}
          {bulletin.student.birth_place && (
            <div>
              <p className="text-xs text-muted-foreground">Lieu de naissance</p>
              <p className="text-sm font-medium">{bulletin.student.birth_place}</p>
            </div>
          )}
        </div>

        {bulletin.modules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Aucune note publiée pour cette période.
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {bulletin.modules.map((mod) => (
              <div key={mod.moduleId}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
                    {mod.moduleName}
                  </h3>
                  {mod.moduleCode && (
                    <span className="text-xs text-muted-foreground">({mod.moduleCode})</span>
                  )}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matière</TableHead>
                      <TableHead className="text-center w-[70px]">Coef.</TableHead>
                      <TableHead className="text-center w-[80px]">Moy /20</TableHead>
                      <TableHead className="text-center w-[100px]">Coef × Moy</TableHead>
                      <TableHead className="text-center w-[60px]">Éval.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mod.subjects.map((s) => (
                      <TableRow key={s.subjectId}>
                        <TableCell className="font-medium">
                          {s.subjectName}
                          {s.subjectCode && (
                            <span className="text-xs text-muted-foreground ml-1">({s.subjectCode})</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{s.coefficient}</TableCell>
                        <TableCell className="text-center font-medium">
                          {s.average.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {(s.average * s.coefficient).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground text-xs">
                          {s.assessmentCount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-end gap-2 py-1 pr-4 text-sm">
                  <span className="text-muted-foreground">Moyenne du module :</span>
                  <span className="font-bold">{mod.moduleAverage.toFixed(2)} / 20</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {bulletin.modules.length > 0 && (
          <div className="border-t-2 pt-4 space-y-2">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="text-sm font-medium">Moyenne générale de l'étudiant</span>
              <span className="text-lg font-bold">{bulletin.generalAverage.toFixed(2)} / 20</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">Moyenne générale de la classe</span>
              <span className="text-lg font-bold text-muted-foreground">{bulletin.classAverage.toFixed(2)} / 20</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10">
              <span className="text-sm font-medium">Rang</span>
              <span className="text-lg font-bold">
                {ordinalSuffix(bulletin.rank)} / {bulletin.totalStudents}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10">
              <span className="text-sm font-medium">Mention</span>
              <Badge variant={
                bulletin.generalAverage >= 16 ? "default" :
                bulletin.generalAverage >= 14 ? "secondary" :
                bulletin.generalAverage >= 12 ? "secondary" :
                bulletin.generalAverage >= 10 ? "outline" : "destructive"
              } className="text-sm">
                <Award className="w-3 h-3 mr-1" />
                {getMention(bulletin.generalAverage)}
              </Badge>
            </div>
          </div>
        )}

        <div className="mt-10 grid grid-cols-2 gap-8 text-xs text-muted-foreground">
          <div className="text-center">
            <p className="font-medium text-foreground mb-1">Le formateur</p>
            <div className="border-t pt-1 mt-16">Signature</div>
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground mb-1">La direction</p>
            <div className="border-t pt-1 mt-16">Cachet et signature</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ordinalSuffix(n: number): string {
  if (n === 1) return "1er";
  return `${n}e`;
}
