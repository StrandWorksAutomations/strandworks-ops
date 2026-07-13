import Link from "next/link";
import { Chrome } from "../components/Chrome";
import { REGISTERS } from "@/lib/registers";

export const revalidate = 60;

export default function RegistersIndex() {
  return (
    <Chrome title="Registers" sub="git is the source of truth" active="/ops">
      {REGISTERS.map((r) => (
        <Link key={r.name} href={`/registers/${r.name}`}>
          <div className="card">
            <h3>{r.title}</h3>
            <div className="meta">{r.blurb}</div>
          </div>
        </Link>
      ))}
    </Chrome>
  );
}
