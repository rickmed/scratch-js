// App.tsx
import React from "react"
import { useForm, FormProvider, useFormContext } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["admin", "user"]),
})

type FormData = z.infer<typeof schema>

export default function App() {
  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", role: "user" },
  })

  const onSubmit = (data: FormData) => {
    console.log("✅ Submitted:", data)
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>User Form</h2>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
          <InputField name="name" label="Name" />
          <InputField name="email" label="Email" />
          <SelectField name="role" label="Role" options={["admin", "user"]} />
          <button type="submit">Submit</button>
        </form>
      </FormProvider>
    </div>
  )
}


import { useFormContext } from "react-hook-form"

type Props = {
  name: string
  label: string
}

export function InputField({ name, label }: Props) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label>
        {label}: <input {...register(name)} />
      </label>
      <div style={{ color: "red" }}>{errors[name]?.message as string}</div>
    </div>
  )
}


import { useFormContext } from "react-hook-form"

type Props = {
  name: string
  label: string
  options: string[]
}

export function SelectField({ name, label, options }: Props) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label>
        {label}:
        <select {...register(name)}>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
      <div style={{ color: "red" }}>{errors[name]?.message as string}</div>
    </div>
  )
}
