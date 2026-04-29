export interface Note {
  id: string
  title: string
  description?: string
  resourceLink: string
  chapterId: string
  createdAt: Date
}

export interface Chapter {
  id: string
  name: string
  subjectId: string
  notesCount: number
}

export interface Subject {
  id: string
  name: string
  standardId: string
}

export interface Standard {
  id: string
  name: string
  examTypes?: string[]
}

export interface ExamType {
  id: string
  name: string
  standardId: string
}

export type WizardStep = 'standard' | 'exam' | 'subject' | 'chapter' | 'notes'

export interface WizardState {
  currentStep: WizardStep
  selectedStandard: Standard | null
  selectedExam: ExamType | null
  selectedSubject: Subject | null
  selectedChapter: Chapter | null
}
