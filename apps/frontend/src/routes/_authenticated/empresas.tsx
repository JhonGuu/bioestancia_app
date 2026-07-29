import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/empresas")({
  component: EmpresasPage,
});

function EmpresasPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  function elegir(empresaId: string) {
    auth.selectEmpresa(empresaId);
    void navigate({ to: "/app" });
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Elegí una empresa</h1>
          <p className="text-muted-foreground text-sm">
            {auth.user ? `Hola, ${auth.user.firstName}` : ""}
          </p>
        </div>

        {auth.empresas.length === 0 ? (
          <Card>
            <CardHeader>
              <CardDescription>
                Tu usuario todavía no tiene acceso a ninguna empresa. Pedile a un
                administrador que te lo otorgue.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          auth.empresas.map((empresa) => (
            <Card
              key={empresa.empresaId}
              className="cursor-pointer transition-colors hover:bg-accent"
              onClick={() => elegir(empresa.empresaId)}
            >
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>{empresa.razonSocial}</CardTitle>
                  <CardDescription className="capitalize">
                    {empresa.rubro}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {empresa.rol}
                </Badge>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" size="sm">
                  Entrar
                </Button>
              </CardContent>
            </Card>
          ))
        )}

        <Button variant="ghost" className="w-full" onClick={() => auth.logout()}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
