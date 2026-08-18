"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BadgeCheck, Globe, Heart, ImageOff, Loader2, MapPin, MessageSquare, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useAddFavorite } from "@/features/dashboard/hooks";
import { useStartChat } from "@/features/chats/hooks";
import { usePublicProfessional } from "@/features/professionals/hooks";

const AVAILABILITY_CONFIG = {
  AVAILABLE: { label: "Available", variant: "default" as const },
  BUSY: { label: "Busy", variant: "secondary" as const },
  UNAVAILABLE: { label: "Unavailable", variant: "outline" as const },
};

function formatRate(min: string | null, max: string | null) {
  if (!min && !max) return null;
  const a = min ? `$${Number(min).toLocaleString()}` : null;
  const b = max ? `$${Number(max).toLocaleString()}` : null;
  return `${a && b ? `${a} – ${b}` : (a ?? b)}/hr`;
}

export default function PublicProfessionalPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { data: profile, isLoading } = usePublicProfessional(params.slug);
  const startChat = useStartChat();
  const addFavorite = useAddFavorite();

  function handleMessage() {
    if (!user) {
      router.push(ROUTES.login);
      return;
    }
    if (!profile) return;
    startChat.mutate(
      { counterpartId: profile.id },
      { onSuccess: (chat) => router.push(`${ROUTES.dashboardMessages}/${chat.id}`) },
    );
  }

  function handleFavorite() {
    if (!user) {
      router.push(ROUTES.login);
      return;
    }
    if (!profile) return;
    addFavorite.mutate(profile.id);
  }

  const displayName = profile
    ? (profile.businessName ?? `${profile.user.firstName} ${profile.user.lastName}`)
    : "";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {isLoading || !profile ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar size="lg">
                  <AvatarFallback className="bg-accent text-lg font-medium text-primary">
                    {profile.user.firstName.charAt(0)}
                    {profile.user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">{displayName}</h1>
                    {profile.verified && <BadgeCheck className="size-5 text-primary" />}
                  </div>
                  {profile.tagline && <p className="text-muted-foreground">{profile.tagline}</p>}
                </div>
              </div>

              {user?.role === "CLIENT" && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleFavorite} disabled={addFavorite.isPending}>
                    <Heart />
                    Save
                  </Button>
                  <Button onClick={handleMessage} disabled={startChat.isPending}>
                    <MessageSquare />
                    Message
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <Badge variant={AVAILABILITY_CONFIG[profile.availability].variant}>
                {AVAILABILITY_CONFIG[profile.availability].label}
              </Badge>
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-primary text-primary" />
                {Number(profile.ratingAvg).toFixed(1)} ({profile.ratingCount})
              </span>
              {profile.category && <span>{profile.category.name}</span>}
              {profile.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-4" />
                  {profile.city.name}
                </span>
              )}
              {formatRate(profile.hourlyRateMin, profile.hourlyRateMax) && (
                <span>{formatRate(profile.hourlyRateMin, profile.hourlyRateMax)}</span>
              )}
              {profile.languages.length > 0 && (
                <span className="flex items-center gap-1">
                  <Globe className="size-4" />
                  {profile.languages.join(", ")}
                </span>
              )}
            </div>

            {profile.about && <p className="mt-6 whitespace-pre-wrap text-foreground">{profile.about}</p>}

            {profile.skills.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill.id} variant="outline">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            )}

            {profile.services.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-lg font-semibold text-foreground">Services</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {profile.services.map((service) => (
                    <Card key={service.id} className="p-4">
                      <CardContent className="grid gap-1 p-0">
                        <p className="font-medium text-foreground">{service.title}</p>
                        {service.description && (
                          <p className="line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
                        )}
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {service.priceType === "FIXED" && service.price
                            ? `$${Number(service.price).toLocaleString()}`
                            : service.minPrice || service.maxPrice
                              ? `$${Number(service.minPrice ?? service.maxPrice).toLocaleString()}+`
                              : "Quote on request"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {profile.certificates.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-lg font-semibold text-foreground">Certificates</h2>
                <div className="grid gap-2">
                  {profile.certificates.map((certificate) => (
                    <div key={certificate.id} className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">{certificate.title}</span>
                      {certificate.issuer && (
                        <span className="text-muted-foreground">· {certificate.issuer}</span>
                      )}
                      {certificate.verified && (
                        <Badge variant="secondary">
                          <BadgeCheck />
                          Verified
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile.portfolioProjects.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-lg font-semibold text-foreground">Portfolio</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {profile.portfolioProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`${ROUTES.feed}/${project.id}`}
                      className="block overflow-hidden rounded-xl bg-muted"
                    >
                      {project.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={project.images[0].url}
                          alt={project.images[0].caption ?? project.title}
                          className="aspect-square w-full object-cover transition-transform hover:scale-105"
                        />
                      ) : (
                        <div className="flex aspect-square w-full items-center justify-center">
                          <ImageOff className="size-6 text-muted-foreground" />
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
