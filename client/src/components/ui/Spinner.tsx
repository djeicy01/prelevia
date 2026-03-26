export default function Spinner({ size = 18 }: { size?: number }) {
  return (
    <div
      className="rounded-full border-[2px] animate-spin flex-shrink-0"
      style={{
        width:  size,
        height: size,
        borderColor: 'rgba(10,110,92,0.15)',
        borderTopColor: '#0A6E5C',
      }}
    />
  )
}
