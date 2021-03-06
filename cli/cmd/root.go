package cmd

import (
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"k8s.io/client-go/util/homedir"
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "porter",
	Short: "Porter is a dashboard for managing Kubernetes clusters.",
	Long:  `Porter is a tool for creating, versioning, and updating Kubernetes deployments using a visual dashboard. For more information, visit github.com/porter-dev/porter`,
}

var home = homedir.HomeDir()

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	Setup()

	if err := rootCmd.Execute(); err != nil {
		color.New(color.FgRed).Println(err)
		os.Exit(1)
	}
}

func Setup() {
	// check that the .porter folder exists; create if not
	porterDir := filepath.Join(home, ".porter")

	if _, err := os.Stat(porterDir); os.IsNotExist(err) {
		os.Mkdir(porterDir, 0700)
	} else if err != nil {
		color.New(color.FgRed).Printf("%v\n", err)
		os.Exit(1)
	}

	viper.SetConfigName("porter")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(porterDir)

	err := viper.ReadInConfig()

	if err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			// create blank config file
			err := ioutil.WriteFile(filepath.Join(home, ".porter", "porter.yaml"), []byte{}, 0644)

			if err != nil {
				color.New(color.FgRed).Printf("%v\n", err)
				os.Exit(1)
			}
		} else {
			// Config file was found but another error was produced
			color.New(color.FgRed).Printf("%v\n", err)
			os.Exit(1)
		}
	}

	// create defaults if configs are not set
	if viper.GetString("host") == "" {
		viper.Set("host", "https://dashboard.getporter.dev")
		viper.WriteConfig()
	}
}
