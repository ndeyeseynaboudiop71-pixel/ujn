import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database";

type Grade = Database["public"]["Tables"]["grades"]["Row"];
type Assessment = Database["public"]["Tables"]["assessments"]["Row"];
type Enrollment = Database["public"]["Tables"]["enrollments"]["Row"];
type Subject = Database["public"]["Tables"]["subjects"]["Row"];
type Module = Database["public"]["Tables"]["modules"]["Row"];
type Term = Database["public"]["Tables"]["terms"]["Row"];
type AcademicYear = Database["public"]["Tables"]["academic_years"]["Row"];
type Course = Database["public"]["Tables"]["courses"]["Row"];
type Program = Database["public"]["Tables"]["programs"]["Row"];
type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type Student = Database["public"]["Tables"]["students"]["Row"];
type Institution = Database["public"]["Tables"]["institutions"]["Row"];

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  coefficient: number;
  assessmentCount: number;
  average: number;
}

export interface ModuleResult {
  moduleId: string;
  moduleName: string;
  moduleCode: string;
  subjects: SubjectResult[];
  moduleAverage: number;
  totalCoefficients: number;
}

export interface StudentBulletinData {
  student: Student;
  enrollment: Enrollment;
  modules: ModuleResult[];
  generalAverage: number;
  totalCoefficients: number;
  rank: number;
  totalStudents: number;
  classAverage: number;
  mention: string;
}

export interface BulletinContext {
  institution: Institution | null;
  academicYear: AcademicYear | null;
  course: Course | null;
  program: Program | null;
  classItem: ClassRow | null;
  term: Term | null;
  termLabel: string;
}

export function getMention(avg: number): string {
  if (avg >= 16) return "Très Bien";
  if (avg >= 14) return "Bien";
  if (avg >= 12) return "Assez Bien";
  if (avg >= 10) return "Passable";
  return "Insuffisant";
}

interface AssessmentWithSubject extends Assessment {
  subjects?: Subject | null;
  term_id: string | null;
}

interface GradeWithAssessment extends Grade {
  assessments?: AssessmentWithSubject | null;
}

interface EnrollmentWithStudent extends Enrollment {
  students?: Student | null;
}

function emptyContext(): BulletinContext {
  return {
    institution: null,
    academicYear: null,
    course: null,
    program: null,
    classItem: null,
    term: null,
    termLabel: "Annuel",
  };
}

export async function computeClassBulletins(
  classId: string,
  academicYearId: string,
  termId: string | "all"
): Promise<{ bulletins: StudentBulletinData[]; context: BulletinContext }> {
  const { data: classItem } = await supabase
    .from("classes")
    .select("*")
    .eq("id", classId)
    .maybeSingle() as { data: ClassRow | null };

  if (!classItem) {
    return { bulletins: [], context: emptyContext() };
  }

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", classItem.course_id)
    .maybeSingle() as { data: Course | null };

  const { data: program } = await supabase
    .from("programs")
    .select("*")
    .eq("id", course?.program_id ?? "")
    .maybeSingle() as { data: Program | null };

  const { data: academicYear } = await supabase
    .from("academic_years")
    .select("*")
    .eq("id", academicYearId)
    .maybeSingle() as { data: AcademicYear | null };

  const { data: institution } = await supabase
    .from("institutions")
    .select("*")
    .eq("id", classItem.institution_id)
    .maybeSingle() as { data: Institution | null };

  let term: Term | null = null;
  let termLabel = "Annuel";

  if (termId !== "all") {
    const { data: termData } = await supabase
      .from("terms")
      .select("*")
      .eq("id", termId)
      .maybeSingle() as { data: Term | null };
    term = termData;
    termLabel = termData?.name ?? "Annuel";
  }

  const context: BulletinContext = {
    institution,
    academicYear,
    course,
    program,
    classItem,
    term,
    termLabel,
  };

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*, students(*)")
    .eq("class_id", classId)
    .eq("academic_year_id", academicYearId)
    .eq("status", "active")
    .order("enrollment_date") as { data: EnrollmentWithStudent[] | null };

  if (!enrollments || enrollments.length === 0) {
    return { bulletins: [], context };
  }

  const { data: assessments } = await supabase
    .from("assessments")
    .select("*, subjects(*)")
    .eq("class_id", classId)
    .eq("academic_year_id", academicYearId)
    .in("status", ["published", "validated"]) as { data: AssessmentWithSubject[] | null };

  if (!assessments || assessments.length === 0) {
    const emptyResults: StudentBulletinData[] = enrollments.map((enr) => ({
      student: enr.students!,
      enrollment: enr,
      modules: [],
      generalAverage: 0,
      totalCoefficients: 0,
      rank: 0,
      totalStudents: enrollments.length,
      classAverage: 0,
      mention: getMention(0),
    }));
    return { bulletins: emptyResults, context };
  }

  const filteredAssessments = termId === "all"
    ? assessments.filter((a) => !a.term_id)
    : assessments.filter((a) => a.term_id === termId);

  const assessmentIds = filteredAssessments.map((a) => a.id);
  if (assessmentIds.length === 0) {
    const emptyResults: StudentBulletinData[] = enrollments.map((enr) => ({
      student: enr.students!,
      enrollment: enr,
      modules: [],
      generalAverage: 0,
      totalCoefficients: 0,
      rank: 0,
      totalStudents: enrollments.length,
      classAverage: 0,
      mention: getMention(0),
    }));
    return { bulletins: emptyResults, context };
  }

  const { data: allGrades } = await supabase
    .from("grades")
    .select("*, assessments(*)")
    .in("assessment_id", assessmentIds)
    .in("status", ["submitted", "validated"]) as { data: GradeWithAssessment[] | null };

  const gradesByStudent: Record<string, GradeWithAssessment[]> = {};
  for (const g of allGrades ?? []) {
    if (!gradesByStudent[g.student_id]) gradesByStudent[g.student_id] = [];
    gradesByStudent[g.student_id].push(g);
  }

  const moduleIds = new Set<string>();
  for (const a of filteredAssessments) {
    if (a.subjects?.module_id) moduleIds.add(a.subjects.module_id);
  }

  const { data: modulesData } = await supabase
    .from("modules")
    .select("*")
    .in("id", [...moduleIds])
    .order("order_index", { ascending: true }) as { data: Module[] | null };

  const moduleMap = new Map((modulesData ?? []).map((m) => [m.id, m]));

  const perStudentResults: StudentBulletinData[] = [];

  for (const enr of enrollments) {
    const student = enr.students;
    if (!student) continue;

    const studentGrades = gradesByStudent[student.id] ?? [];

    const subjectMap = new Map<string, {
      weightedSum: number;
      totalCoef: number;
      count: number;
      subject: Subject;
    }>();

    for (const g of studentGrades) {
      const a = g.assessments;
      if (!a) continue;
      const subj = a.subjects;
      if (!subj) continue;

      const normalizedScore = (Number(g.score) / Number(a.max_score)) * 20;

      const existing = subjectMap.get(subj.id);
      if (existing) {
        existing.weightedSum += normalizedScore * Number(a.coefficient);
        existing.totalCoef += Number(a.coefficient);
        existing.count += 1;
      } else {
        subjectMap.set(subj.id, {
          weightedSum: normalizedScore * Number(a.coefficient),
          totalCoef: Number(a.coefficient),
          count: 1,
          subject: subj,
        });
      }
    }

    const subjectsByModule = new Map<string, SubjectResult[]>();
    for (const [subjectId, data] of subjectMap) {
      const moduleId = data.subject.module_id;
      if (!subjectsByModule.has(moduleId)) subjectsByModule.set(moduleId, []);
      subjectsByModule.get(moduleId)!.push({
        subjectId,
        subjectName: data.subject.name,
        subjectCode: data.subject.code,
        coefficient: Number(data.subject.coefficient),
        assessmentCount: data.count,
        average: data.totalCoef > 0 ? data.weightedSum / data.totalCoef : 0,
      });
    }

    const moduleResults: ModuleResult[] = [];
    for (const [moduleId, subjects] of subjectsByModule) {
      const mod = moduleMap.get(moduleId);
      const totalCoef = subjects.reduce((s, sub) => s + sub.coefficient, 0);
      const weightedSum = subjects.reduce((s, sub) => s + sub.average * sub.coefficient, 0);
      moduleResults.push({
        moduleId,
        moduleName: mod?.name ?? "—",
        moduleCode: mod?.code ?? "",
        subjects: subjects.sort((a, b) => a.subjectName.localeCompare(b.subjectName)),
        moduleAverage: totalCoef > 0 ? weightedSum / totalCoef : 0,
        totalCoefficients: totalCoef,
      });
    }

    moduleResults.sort((a, b) => {
      const orderA = moduleMap.get(a.moduleId)?.order_index ?? 0;
      const orderB = moduleMap.get(b.moduleId)?.order_index ?? 0;
      return orderA - orderB;
    });

    const totalCoefficients = moduleResults.reduce((s, m) => s + m.totalCoefficients, 0);
    const weightedSum = moduleResults.reduce(
      (s, m) => s + m.moduleAverage * m.totalCoefficients,
      0
    );
    const generalAverage = totalCoefficients > 0 ? weightedSum / totalCoefficients : 0;

    perStudentResults.push({
      student,
      enrollment: enr,
      modules: moduleResults,
      generalAverage,
      totalCoefficients,
      rank: 0,
      totalStudents: enrollments.length,
      classAverage: 0,
      mention: getMention(generalAverage),
    });
  }

  perStudentResults.sort((a, b) => b.generalAverage - a.generalAverage);
  perStudentResults.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  const validAverages = perStudentResults.filter((r) => r.totalCoefficients > 0);
  const classAverage =
    validAverages.length > 0
      ? validAverages.reduce((s, r) => s + r.generalAverage, 0) / validAverages.length
      : 0;

  for (const r of perStudentResults) {
    r.classAverage = classAverage;
  }

  return { bulletins: perStudentResults, context };
}
