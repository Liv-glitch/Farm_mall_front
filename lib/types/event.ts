export type EventMode = "online" | "physical"

export interface Event {
  id: string
  name: string
  date: string
  mode: EventMode
  location?: string | null
  registrationLink?: string
  registration_link?: string
  description: string
  createdBy?: string | null
  createdAt: string
  updatedAt: string
}

export interface EventFormData {
  name: string
  date: string
  mode: EventMode
  location: string
  registration_link: string
  description: string
}
