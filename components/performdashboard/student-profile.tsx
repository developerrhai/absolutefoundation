"use client";

import { Phone, GraduationCap, Shield, MapPin } from "lucide-react";
import Image from "next/image";

interface StudentProfileProps {
  name: string;
  phone: string;
  className: string;
  board: string;
  location: string;
}

export function StudentProfile({
  name,
  phone,
  className,
  board,
  location,
}: StudentProfileProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center shadow-md">
        <Image
          src="/student-avatar.png"
          alt={name}
          width={80}
          height={80}
          className="object-cover"
        />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-slate-800">{name}</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            <span>{phone}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Class: {className}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            <span>Board: {board}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>Location: {location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
