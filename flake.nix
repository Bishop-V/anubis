{
  description = "Anubis browser extension dev shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    flake-parts.inputs.nixpkgs-lib.follows = "nixpkgs";
  };

  outputs = inputs:
    inputs.flake-parts.lib.mkFlake {inherit inputs;} {
      systems = ["x86_64-linux" "aarch64-linux"];

      perSystem = {pkgs, ...}: {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
            chromium # `npm run dev` opens this; `npm run dev:firefox` uses your system Firefox
          ];
          shellHook = ''
            [ -d node_modules ] || npm install
          '';
        };

        formatter = pkgs.alejandra;
      };
    };
}
