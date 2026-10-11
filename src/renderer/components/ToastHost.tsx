export function ToastHost(props: { toasts: { id: number; text: string }[] }) {
  return (
    <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col gap-2">
      {props.toasts.map((toast) => (
        <div key={toast.id} className="glass pointer-events-auto rounded-xl px-4 py-2 text-sm shadow-lg">
          {toast.text}
        </div>
      ))}
    </div>
  )
}
